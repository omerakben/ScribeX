import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/react";

// ─── Floating Menu Plugin ────────────────────────────────────────
// Detects text selections and emits positioning data for a floating
// toolbar that appears above (or below) the selected text.
// This is a pure ProseMirror plugin — no Zustand, no decorations,
// no visual output. The React floating menu component reads state
// via getFloatingMenuState().

const MENU_HEIGHT = 52; // px — height of the floating action buttons
const MENU_OFFSET = 8;  // px — gap between selection edge and menu
const DEBOUNCE_MS = 300;
const EDGE_MARGIN = 16; // px — minimum distance from scroll-area edges

export const floatingMenuPluginKey = new PluginKey<FloatingMenuPluginState>(
  "floatingMenu"
);

// ─── State ───────────────────────────────────────────────────────

export interface FloatingMenuPluginState {
  /** Whether to show the floating menu */
  visible: boolean;
  /** Absolute top position relative to .editor-scroll-area */
  top: number;
  /** Absolute left position relative to .editor-scroll-area */
  left: number;
  /** True when there is not enough room above — menu renders below instead */
  flipped: boolean;
  /** The currently selected text */
  selectedText: string;
  /** ProseMirror document positions for the selection */
  selectionRange: { from: number; to: number } | null;
}

const HIDDEN_STATE: FloatingMenuPluginState = {
  visible: false,
  top: 0,
  left: 0,
  flipped: false,
  selectedText: "",
  selectionRange: null,
};

// ─── Positioning helper ──────────────────────────────────────────

function calcPosition(
  view: EditorView,
  from: number,
  to: number
): Pick<FloatingMenuPluginState, "top" | "left" | "flipped"> | null {
  const scrollArea = view.dom.closest(".editor-scroll-area");
  if (!scrollArea) return null;

  const areaRect = scrollArea.getBoundingClientRect();

  const fromCoords = view.coordsAtPos(from);
  const toCoords = view.coordsAtPos(to);

  // Horizontal centre between start and end of selection
  const rawLeft =
    (fromCoords.left + toCoords.left) / 2 - areaRect.left;

  // Clamp so the menu never bleeds outside the scroll area
  const maxLeft = areaRect.width - EDGE_MARGIN;
  const left = Math.max(EDGE_MARGIN, Math.min(rawLeft, maxLeft));

  // Try above first
  const topEdge =
    Math.min(fromCoords.top, toCoords.top) -
    areaRect.top -
    MENU_HEIGHT -
    MENU_OFFSET;

  if (topEdge >= 0) {
    return { top: topEdge, left, flipped: false };
  }

  // Not enough room above — flip below
  const bottomEdge =
    Math.max(fromCoords.bottom, toCoords.bottom) -
    areaRect.top +
    MENU_OFFSET;

  return { top: bottomEdge, left, flipped: true };
}

// ─── Extension ───────────────────────────────────────────────────

export const FloatingMenuPlugin = Extension.create({
  name: "floatingMenuPlugin",

  addOptions() {
    return {
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    const extensionOptions = this.options;

    return [
      new Plugin({
        key: floatingMenuPluginKey,

        // ── Plugin state ─────────────────────────────────────────
        state: {
          init(): FloatingMenuPluginState {
            return { ...HIDDEN_STATE };
          },

          apply(tr, value): FloatingMenuPluginState {
            // Explicit show/hide dispatched by the view() lifecycle
            const meta = tr.getMeta(floatingMenuPluginKey) as
              | FloatingMenuPluginState
              | { dismiss: true }
              | undefined;

            if (meta !== undefined) {
              if ("dismiss" in meta) {
                return { ...HIDDEN_STATE };
              }
              return meta as FloatingMenuPluginState;
            }

            // Collapsed cursor → hide immediately (no wait for debounce)
            if (tr.selectionSet) {
              const { from, to } = tr.selection;
              if (from === to) {
                return { ...HIDDEN_STATE };
              }
            }

            // Doc change while selection is active → keep last visible state
            // (view lifecycle will re-debounce and update position)
            return value;
          },
        },

        // ── Key handler ──────────────────────────────────────────
        props: {
          handleKeyDown(view: EditorView, event: KeyboardEvent): boolean {
            if (event.key !== "Escape") return false;

            const pluginState = floatingMenuPluginKey.getState(view.state);
            if (!pluginState?.visible) return false;

            event.preventDefault();
            const tr = view.state.tr.setMeta(floatingMenuPluginKey, {
              dismiss: true,
            });
            view.dispatch(tr);
            return true;
          },
        },

        // ── View lifecycle ───────────────────────────────────────
        view(editorView: EditorView) {
          let debounceTimer: ReturnType<typeof setTimeout> | null = null;

          const dismiss = () => {
            if (debounceTimer) {
              clearTimeout(debounceTimer);
              debounceTimer = null;
            }
            const current = floatingMenuPluginKey.getState(editorView.state);
            if (!current?.visible) return;
            const tr = editorView.state.tr.setMeta(floatingMenuPluginKey, {
              dismiss: true,
            });
            editorView.dispatch(tr);
          };

          const scheduleUpdate = () => {
            if (debounceTimer) clearTimeout(debounceTimer);

            if (!extensionOptions.enabled) return;

            debounceTimer = setTimeout(() => {
              debounceTimer = null;

              if (!extensionOptions.enabled) return;

              const { state } = editorView;
              const { from, to } = state.selection;

              // Guard: selection may have collapsed during debounce
              if (from === to) {
                const current = floatingMenuPluginKey.getState(state);
                if (current?.visible) {
                  editorView.dispatch(
                    state.tr.setMeta(floatingMenuPluginKey, { dismiss: true })
                  );
                }
                return;
              }

              const selectedText = state.doc.textBetween(from, to, " ");
              if (!selectedText.trim()) return;

              const pos = calcPosition(editorView, from, to);
              if (!pos) return;

              const nextState: FloatingMenuPluginState = {
                visible: true,
                top: pos.top,
                left: pos.left,
                flipped: pos.flipped,
                selectedText,
                selectionRange: { from, to },
              };

              editorView.dispatch(
                editorView.state.tr.setMeta(floatingMenuPluginKey, nextState)
              );
            }, DEBOUNCE_MS);
          };

          // Dismiss when the user clicks outside the floating menu
          const handleMouseDown = (event: MouseEvent) => {
            const target = event.target as Element | null;
            if (!target) return;
            // The React component must put data-floating-menu on its root element
            if (target.closest("[data-floating-menu]")) return;
            dismiss();
          };

          document.addEventListener("mousedown", handleMouseDown);

          return {
            update(view: EditorView) {
              if (!extensionOptions.enabled) {
                dismiss();
                return;
              }

              const { from, to } = view.state.selection;

              if (from === to) {
                // Collapsed — ensure hidden (may already be hidden via apply())
                const current = floatingMenuPluginKey.getState(view.state);
                if (current?.visible) {
                  if (debounceTimer) clearTimeout(debounceTimer);
                  editorView.dispatch(
                    view.state.tr.setMeta(floatingMenuPluginKey, { dismiss: true })
                  );
                }
                return;
              }

              // Non-empty selection: (re-)schedule position calculation
              scheduleUpdate();
            },

            destroy() {
              if (debounceTimer) clearTimeout(debounceTimer);
              document.removeEventListener("mousedown", handleMouseDown);
            },
          };
        },
      }),
    ];
  },
});

// ─── Public reader ───────────────────────────────────────────────

/**
 * Read the current FloatingMenuPlugin state from a TipTap editor.
 * Call this inside an `onSelectionUpdate` / `onTransaction` callback or
 * a React effect — the plugin state is synchronously up to date on each
 * transaction.
 *
 * @example
 * const state = getFloatingMenuState(editor);
 * if (state?.visible) { ... }
 */
export function getFloatingMenuState(
  editor: Editor
): FloatingMenuPluginState | null {
  return floatingMenuPluginKey.getState(editor.state) ?? null;
}
