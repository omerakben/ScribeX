"use client";

import { useSyncExternalStore } from "react";
import { Toaster } from "sonner";

const subscribe = () => () => {};

export function ToasterProvider() {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);

  if (!isClient) return null;

  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          fontFamily: "var(--font-sans)",
        },
      }}
    />
  );
}
