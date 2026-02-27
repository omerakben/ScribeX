import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";
import { fimCompletion } from "@/lib/mercury/client";
import { AUTOCOMPLETE_DELAY_MS } from "@/lib/constants";

// ─── Ghost Text Extension ───────────────────────────────────────
// Renders FIM (Fill-in-the-Middle) completions as translucent
// ghost text after the cursor. Tab accepts; any other input dismisses.

const ghostTextPluginKey = new PluginKey("ghostText");

/** Minimum prefix length before triggering a FIM request. */
const MIN_PREFIX_LENGTH = 20;

/** Maximum chars of context to send as prefix / suffix. */
const MAX_PREFIX_CHARS = 2000;
const MAX_SUFFIX_CHARS = 500;

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
          init() {
            return { ghostText: null as string | null, pos: -1 };
          },
          apply(tr, value) {
            // If the transaction carries our metadata, update state
            const meta = tr.getMeta(ghostTextPluginKey);
            if (meta !== undefined) {
              return meta;
            }
            // Clear ghost text on any doc change or selection change
            if (tr.docChanged || tr.selectionSet) {
              return { ghostText: null, pos: -1 };
            }
            return value;
          },
        },

        props: {
          decorations(state) {
            const pluginState = ghostTextPluginKey.getState(state);
            if (!pluginState?.ghostText || pluginState.pos < 0) {
              return DecorationSet.empty;
            }

            const { ghostText, pos } = pluginState;

            const widget = Decoration.widget(
              pos,
              () => {
                const span = document.createElement("span");
                span.className = "ghost-text";
                span.textContent = ghostText;
                return span;
              },
              { side: 1 }
            );

            return DecorationSet.create(state.doc, [widget]);
          },

          handleKeyDown(view: EditorView, event: KeyboardEvent) {
            const pluginState = ghostTextPluginKey.getState(view.state);
            if (!pluginState?.ghostText) return false;

            // Tab accepts ghost text
            if (event.key === "Tab") {
              event.preventDefault();
              const { ghostText, pos } = pluginState;

              // Clear the ghost text first, then insert
              const tr = view.state.tr;
              tr.setMeta(ghostTextPluginKey, { ghostText: null, pos: -1 });
              tr.insertText(ghostText, pos);
              view.dispatch(tr);
              return true;
            }

            // Escape dismisses ghost text
            if (event.key === "Escape") {
              event.preventDefault();
              const tr = view.state.tr;
              tr.setMeta(ghostTextPluginKey, { ghostText: null, pos: -1 });
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

          const scheduleCompletion = () => {
            // Cancel any pending timer / request
            if (debounceTimer) clearTimeout(debounceTimer);
            if (abortController) {
              abortController.abort();
              abortController = null;
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
                  signal: abortController.signal,
                });

                // Validate we still have the same cursor position
                const afterSelection = editorView.state.selection;
                if (!afterSelection.empty || afterSelection.from !== cursorPos) {
                  return;
                }

                const trimmed = completion.trimEnd();
                if (!trimmed) return;

                // Set ghost text via transaction metadata
                const tr = editorView.state.tr;
                tr.setMeta(ghostTextPluginKey, {
                  ghostText: trimmed,
                  pos: cursorPos,
                });
                editorView.dispatch(tr);
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
            },
          };
        },
      }),
    ];
  },
});
