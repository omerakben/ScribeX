// ─── LocalStorage Persistence Layer ──────────────────────────────
// Thin wrapper around localStorage for SSR safety, quota handling,
// and namespaced keys. Used by Zustand persist middleware.

export const STORAGE_VERSION = 1;

export const STORAGE_KEYS = {
  editor: "scribex:editor",
  dashboard: "scribex:dashboard",
} as const;

const isBrowser = typeof window !== "undefined";

/** Read and parse a JSON value from localStorage. Returns `null` on any failure. */
export function safeParse<T>(key: string): T | null {
  if (!isBrowser) return null;

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Write a JSON value to localStorage. Silently fails on quota exceeded or SSR. */
export function safeWrite<T>(key: string, value: T): boolean {
  if (!isBrowser) return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // QuotaExceededError or SecurityError in private browsing
    return false;
  }
}

/** Remove a key from localStorage. */
export function safeRemove(key: string): void {
  if (!isBrowser) return;

  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
