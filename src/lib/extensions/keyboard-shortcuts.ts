import { Extension } from "@tiptap/react";

// ─── AI Keyboard Shortcuts Extension ────────────────────────────
// Provides Cmd/Ctrl+Shift+[key] bindings that dispatch custom events
// to open the floating ribbon in a specific mode.
//
// Bindings:
//   Mod+Shift+R → rewrite
//   Mod+Shift+H → humanize
//   Mod+Shift+F → fix
//   Mod+Shift+Y → stylize  (Cmd+Shift+S conflicts with browser "Save As")
//   Mod+Shift+D → detect
//
// The floating menu component listens for `scribex:shortcut` events
// and opens the ribbon if a text selection is active.

export type ShortcutAction = "rewrite" | "humanize" | "fix" | "stylize" | "detect";

export interface ScribexShortcutEvent {
  action: ShortcutAction;
}

declare global {
  interface DocumentEventMap {
    "scribex:shortcut": CustomEvent<ScribexShortcutEvent>;
  }
}

function dispatchShortcut(action: ShortcutAction): boolean {
  document.dispatchEvent(
    new CustomEvent<ScribexShortcutEvent>("scribex:shortcut", {
      detail: { action },
      bubbles: false,
    })
  );
  // Return true to signal TipTap the key was handled (prevents default browser behaviour)
  return true;
}

export const AIKeyboardShortcuts = Extension.create({
  name: "aiKeyboardShortcuts",

  addKeyboardShortcuts() {
    return {
      // Rewrite — Cmd/Ctrl+Shift+R
      "Mod-Shift-r": () => dispatchShortcut("rewrite"),
      // Humanize — Cmd/Ctrl+Shift+H
      "Mod-Shift-h": () => dispatchShortcut("humanize"),
      // Fix Grammar — Cmd/Ctrl+Shift+F
      "Mod-Shift-f": () => dispatchShortcut("fix"),
      // Stylize — Cmd/Ctrl+Shift+Y (avoids browser "Save As" on Cmd+Shift+S)
      "Mod-Shift-y": () => dispatchShortcut("stylize"),
      // Detect AI — Cmd/Ctrl+Shift+D
      "Mod-Shift-d": () => dispatchShortcut("detect"),
    };
  },
});
