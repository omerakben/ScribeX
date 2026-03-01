"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/lib/store/editor-store";
import { useHydration } from "@/hooks/use-hydration";

/**
 * DarkModeProvider — reads `darkMode` from the persisted editor store and
 * applies/removes the `.dark` class on `<html>`.  Waits for Zustand hydration
 * before acting so the correct persisted value is used (avoids flash).
 */
export function DarkModeProvider() {
  const hydrated = useHydration();
  const darkMode = useEditorStore((s) => s.darkMode);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, [hydrated, darkMode]);

  return null;
}
