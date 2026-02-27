"use client";

import { useSyncExternalStore } from "react";
import { useEditorStore, useDashboardStore } from "@/lib/store/editor-store";

/** Trigger rehydration if not already hydrated (idempotent, HMR-safe). */
function ensureRehydrated() {
  if (!useEditorStore.persist.hasHydrated()) {
    useEditorStore.persist.rehydrate();
  }
  if (!useDashboardStore.persist.hasHydrated()) {
    useDashboardStore.persist.rehydrate();
  }
}

/**
 * Returns true once Zustand persist middleware has rehydrated **both** stores
 * from localStorage. Uses useSyncExternalStore to comply with React lint rules.
 */
export function useHydration() {
  ensureRehydrated();

  return useSyncExternalStore(
    (callback) => {
      const unsubEditor = useEditorStore.persist.onFinishHydration(callback);
      const unsubDashboard = useDashboardStore.persist.onFinishHydration(callback);
      return () => {
        unsubEditor();
        unsubDashboard();
      };
    },
    () =>
      useEditorStore.persist.hasHydrated() &&
      useDashboardStore.persist.hasHydrated(),
    () => false
  );
}
