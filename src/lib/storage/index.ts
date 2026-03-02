// ─── LocalStorage Persistence Layer ──────────────────────────────
// Thin wrapper around localStorage for SSR safety, quota handling,
// and namespaced keys. Used by Zustand persist middleware.

export const STORAGE_VERSION = 1;

export const STORAGE_KEYS = {
  editor: "scribex:editor",
  dashboard: "scribex:dashboard",
  joinCode: "scribex-join-code",
} as const;

