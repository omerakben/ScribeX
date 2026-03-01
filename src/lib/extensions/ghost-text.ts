import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";
import { fimCompletion } from "@/lib/mercury/client";
import { AUTOCOMPLETE_DELAY_MS } from "@/lib/constants";

// ─── Ghost Text Extension ───────────────────────────────────────
// Renders FIM (Fill-in-the-Middle) completions as translucent
// ghost text after the cursor. Tab accepts word-by-word;
// Cmd/Ctrl+Enter accepts all remaining; Arrow Up/Down cycles
// through cached alternatives; Escape dismisses.

const ghostTextPluginKey = new PluginKey("ghostText");

/** Minimum prefix length before triggering a FIM request. */
const MIN_PREFIX_LENGTH = 20;

/** Maximum chars of context to send as prefix / suffix. */
const MAX_PREFIX_CHARS = 2000;
const MAX_SUFFIX_CHARS = 500;

/** Maximum number of cached alternatives per cursor position. */
const MAX_ALTERNATIVES = 5;

/** Temperature increment per alternative (0.0, 0.1, 0.2, ...). */
const TEMP_INCREMENT = 0.1;

/** Similarity threshold — alternatives with Jaccard similarity above this are deduplicated. */
const SIMILARITY_THRESHOLD = 0.8;

// ─── Plugin State ────────────────────────────────────────────────

interface GhostTextState {
  alternatives: string[];
  activeIndex: number;
  pos: number;
}

const EMPTY_STATE: GhostTextState = { alternatives: [], activeIndex: 0, pos: -1 };

/** Derive the current ghost text from plugin state. */
function getGhostText(state: GhostTextState): string | null {
  if (state.alternatives.length === 0 || state.pos < 0) return null;
  return state.alternatives[state.activeIndex] ?? null;
}

/** Word-level Jaccard similarity for deduplication. */
function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

/** Check if a completion is too similar to any existing alternative. */
function isDuplicate(candidate: string, existing: string[]): boolean {
  const trimmed = candidate.trim();
  for (const alt of existing) {
    if (alt.trim() === trimmed) return true;
    if (jaccardSimilarity(alt, trimmed) >= SIMILARITY_THRESHOLD) return true;
  }
  return false;
}

// ─── Smart Spacing ──────────────────────────────────────────────

/**
 * Normalize spacing between the text before the cursor, the text
 * being accepted from ghost text, and the text after the cursor.
 *
 * Rules:
 * - If charBefore is a word char and accepted starts with a word char, prepend space.
 * - If charBefore is whitespace and accepted starts with space, strip leading space.
 * - Collapse any runs of multiple spaces down to one.
 * - If accepted ends with space and charAfter is whitespace, trim trailing space.
 */
function normalizeSpacing(accepted: string, charBefore: string, charAfter: string): string {
  let result = accepted;

  if (charBefore) {
    // Missing space: add one when word meets word
    if (/\w/.test(charBefore) && /^\w/.test(result)) {
      result = " " + result;
    }

    // No double spaces: strip leading space when already after whitespace
    if (/\s/.test(charBefore) && result.startsWith(" ")) {
      result = result.trimStart();
    }
  }

  // Collapse internal multiple spaces to single
  result = result.replace(/ {2,}/g, " ");

  // Trim trailing space if next char is already whitespace
  if (charAfter && /\s/.test(charAfter) && result.endsWith(" ")) {
    result = result.trimEnd();
  }

  return result;
}

export const GhostText = Extension.create({
  name: "ghostText",

  addOptions() {
    return {
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    const extensionOptions = this.options;

    return [
      new Plugin({
        key: ghostTextPluginKey,

        state: {
          init(): GhostTextState {
            return { ...EMPTY_STATE };
          },
          apply(tr, value: GhostTextState): GhostTextState {
            const meta = tr.getMeta(ghostTextPluginKey);
            if (meta !== undefined) {
              return meta as GhostTextState;
            }
            // Clear alternatives on any doc change or selection change
            if (tr.docChanged || tr.selectionSet) {
              return { ...EMPTY_STATE };
            }
            return value;
          },
        },

        props: {
          decorations(state) {
            const pluginState = ghostTextPluginKey.getState(state) as GhostTextState;
            const ghostText = getGhostText(pluginState);
            if (!ghostText || pluginState.pos < 0) {
              return DecorationSet.empty;
            }

            const { pos, alternatives, activeIndex } = pluginState;
            const hasMultiple = alternatives.length > 1;

            const widget = Decoration.widget(
              pos,
              () => {
                const container = document.createElement("span");
                container.className = "ghost-text";
                container.textContent = ghostText;

                // Show alternative indicator when multiple alternatives exist
                if (hasMultiple) {
                  const badge = document.createElement("span");
                  badge.className = "ghost-text-badge";
                  badge.textContent = `${activeIndex + 1}/${alternatives.length}`;
                  container.appendChild(badge);
                }

                return container;
              },
              { side: 1 }
            );

            return DecorationSet.create(state.doc, [widget]);
          },

          handleKeyDown(view: EditorView, event: KeyboardEvent) {
            const pluginState = ghostTextPluginKey.getState(view.state) as GhostTextState;
            const ghostText = getGhostText(pluginState);
            if (!ghostText) return false;

            // Tab accepts next word of ghost text
            if (event.key === "Tab" && !event.shiftKey) {
              event.preventDefault();
              const { pos, alternatives, activeIndex } = pluginState;

              // Context characters for smart spacing
              const charBefore = pos > 0
                ? view.state.doc.textBetween(pos - 1, pos)
                : "";
              const charAfter = pos < view.state.doc.content.size
                ? view.state.doc.textBetween(pos, pos + 1)
                : "";

              // Split into first word (+ optional trailing space) and remainder
              const match = ghostText.match(/^(\S+\s?)([\s\S]*)$/);
              if (!match) {
                // Edge case: whitespace-only — accept all and clear
                const normalized = normalizeSpacing(ghostText, charBefore, charAfter);
                const tr = view.state.tr;
                tr.setMeta(ghostTextPluginKey, { ...EMPTY_STATE });
                tr.insertText(normalized, pos);
                view.dispatch(tr);
                return true;
              }

              // For word-by-word, charAfter is the remainder ghost text (not doc text)
              const wordCharAfter = match[2] ? match[2][0] : charAfter;
              const firstWord = normalizeSpacing(match[1], charBefore, wordCharAfter);
              const remainder = match[2];

              const tr = view.state.tr;

              if (!remainder || !remainder.trim()) {
                // Last word — accept and clear
                tr.setMeta(ghostTextPluginKey, { ...EMPTY_STATE });
                tr.insertText(firstWord, pos);
              } else {
                // Insert first word, update active alternative to remainder
                const updatedAlternatives = [...alternatives];
                updatedAlternatives[activeIndex] = remainder;
                tr.setMeta(ghostTextPluginKey, {
                  alternatives: updatedAlternatives,
                  activeIndex,
                  pos: pos + firstWord.length,
                });
                tr.insertText(firstWord, pos);
              }

              view.dispatch(tr);
              return true;
            }

            // Cmd/Ctrl+Enter accepts all remaining ghost text
            if (
              event.key === "Enter" &&
              (event.metaKey || event.ctrlKey)
            ) {
              event.preventDefault();
              const { pos } = pluginState;

              const charBefore = pos > 0
                ? view.state.doc.textBetween(pos - 1, pos)
                : "";
              const charAfter = pos < view.state.doc.content.size
                ? view.state.doc.textBetween(pos, pos + 1)
                : "";
              const normalized = normalizeSpacing(ghostText, charBefore, charAfter);

              const tr = view.state.tr;
              tr.setMeta(ghostTextPluginKey, { ...EMPTY_STATE });
              tr.insertText(normalized, pos);
              view.dispatch(tr);
              return true;
            }

            // Arrow Down: cycle to next alternative
            if (event.key === "ArrowDown" && pluginState.alternatives.length > 1) {
              event.preventDefault();
              const { alternatives, activeIndex, pos } = pluginState;
              const nextIndex = (activeIndex + 1) % alternatives.length;
              const tr = view.state.tr;
              tr.setMeta(ghostTextPluginKey, {
                alternatives,
                activeIndex: nextIndex,
                pos,
              });
              view.dispatch(tr);
              return true;
            }

            // Arrow Up: cycle to previous alternative
            if (event.key === "ArrowUp" && pluginState.alternatives.length > 1) {
              event.preventDefault();
              const { alternatives, activeIndex, pos } = pluginState;
              const prevIndex = (activeIndex - 1 + alternatives.length) % alternatives.length;
              const tr = view.state.tr;
              tr.setMeta(ghostTextPluginKey, {
                alternatives,
                activeIndex: prevIndex,
                pos,
              });
              view.dispatch(tr);
              return true;
            }

            // Escape dismisses ghost text
            if (event.key === "Escape") {
              event.preventDefault();
              const tr = view.state.tr;
              tr.setMeta(ghostTextPluginKey, { ...EMPTY_STATE });
              view.dispatch(tr);
              return true;
            }

            // All other keys: ghost text gets cleared by the state.apply
            // via docChanged/selectionSet, so we just return false
            return false;
          },
        },

        view(editorView: EditorView) {
          let debounceTimer: ReturnType<typeof setTimeout> | null = null;
          let abortController: AbortController | null = null;
          let prefetchController: AbortController | null = null;

          /** Fetch a single alternative at the given temperature. */
          const fetchAlternative = async (
            prefix: string,
            suffix: string,
            temperature: number,
            signal: AbortSignal
          ): Promise<string | null> => {
            try {
              const completion = await fimCompletion(prefix, suffix, {
                maxTokens: 128,
                temperature,
                signal,
              });
              const trimmed = completion.trimEnd();
              return trimmed || null;
            } catch {
              return null;
            }
          };

          /** Pre-fetch one additional alternative in the background. */
          const prefetchNext = (
            prefix: string,
            suffix: string,
            cursorPos: number,
            currentAlternatives: string[]
          ) => {
            if (currentAlternatives.length >= MAX_ALTERNATIVES) return;
            if (prefetchController) prefetchController.abort();
            prefetchController = new AbortController();

            const nextIndex = currentAlternatives.length;
            const temp = nextIndex * TEMP_INCREMENT;

            fetchAlternative(prefix, suffix, temp, prefetchController.signal)
              .then((result) => {
                if (!result) return;

                // Verify we're still at the same cursor position with the same alternatives
                const currentState = ghostTextPluginKey.getState(
                  editorView.state
                ) as GhostTextState;
                if (currentState.pos !== cursorPos) return;
                if (currentState.alternatives.length !== currentAlternatives.length) return;

                // Dedup check
                if (isDuplicate(result, currentState.alternatives)) return;

                // Append the new alternative
                const tr = editorView.state.tr;
                tr.setMeta(ghostTextPluginKey, {
                  alternatives: [...currentState.alternatives, result],
                  activeIndex: currentState.activeIndex,
                  pos: currentState.pos,
                });
                editorView.dispatch(tr);
              })
              .catch(() => {
                // Silently ignore prefetch failures
              });
          };

          const scheduleCompletion = () => {
            // Cancel any pending timer / request
            if (debounceTimer) clearTimeout(debounceTimer);
            if (abortController) {
              abortController.abort();
              abortController = null;
            }
            if (prefetchController) {
              prefetchController.abort();
              prefetchController = null;
            }

            // Bail out if extension is disabled
            if (!extensionOptions.enabled) return;

            const { state } = editorView;
            const { selection } = state;

            // Only trigger for collapsed cursor (not a range selection)
            if (!selection.empty) return;

            const cursorPos = selection.from;

            // Extract prefix and suffix text around cursor
            const prefixFull = state.doc.textBetween(0, cursorPos, "\n");
            const suffixFull = state.doc.textBetween(
              cursorPos,
              state.doc.content.size,
              "\n"
            );

            const prefix = prefixFull.slice(-MAX_PREFIX_CHARS);
            const suffix = suffixFull.slice(0, MAX_SUFFIX_CHARS);

            // Need minimum prefix to make a useful completion
            if (prefix.length < MIN_PREFIX_LENGTH) return;

            debounceTimer = setTimeout(async () => {
              // Double-check extension is still enabled
              if (!extensionOptions.enabled) return;

              // Double-check cursor hasn't moved
              const currentSelection = editorView.state.selection;
              if (!currentSelection.empty || currentSelection.from !== cursorPos) {
                return;
              }

              abortController = new AbortController();

              try {
                const completion = await fimCompletion(prefix, suffix, {
                  maxTokens: 128,
                  temperature: 0.0,
                  signal: abortController.signal,
                });

                // Validate we still have the same cursor position
                const afterSelection = editorView.state.selection;
                if (!afterSelection.empty || afterSelection.from !== cursorPos) {
                  return;
                }

                const trimmed = completion.trimEnd();
                if (!trimmed) return;

                // Set first alternative via transaction metadata
                const alternatives = [trimmed];
                const tr = editorView.state.tr;
                tr.setMeta(ghostTextPluginKey, {
                  alternatives,
                  activeIndex: 0,
                  pos: cursorPos,
                });
                editorView.dispatch(tr);

                // Pre-fetch one additional alternative in the background
                prefetchNext(prefix, suffix, cursorPos, alternatives);
              } catch {
                // Silently ignore - autocomplete is non-critical
              }
            }, AUTOCOMPLETE_DELAY_MS);
          };

          return {
            update(view: EditorView, prevState) {
              // Only trigger on doc changes (user typing)
              if (!view.state.doc.eq(prevState.doc)) {
                scheduleCompletion();
              }
            },

            destroy() {
              if (debounceTimer) clearTimeout(debounceTimer);
              if (abortController) abortController.abort();
              if (prefetchController) prefetchController.abort();
            },
          };
        },
      }),
    ];
  },
});
