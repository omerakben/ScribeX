"use client";

import { X } from "lucide-react";
import { useEditorStore } from "@/lib/store/editor-store";
import type { WritingMode } from "@/lib/types";

const modeLabels: Record<WritingMode, string> = {
  compose: "Composing",
  autocomplete: "Autocompleting",
  "quick-edit": "Quick Editing",
  "deep-rewrite": "Deep Rewriting",
  "next-edit": "Next Edit",
  review: "Reviewing",
  "diffusion-draft": "Diffusing",
};

export function WritingModeBar() {
  const activeMode = useEditorStore((s) => s.activeWritingMode);
  const isStreaming = useEditorStore((s) => s.isAIStreaming);
  const setActiveWritingMode = useEditorStore((s) => s.setActiveWritingMode);

  if (!activeMode) return null;

  return (
    <div className="flex h-8 flex-shrink-0 items-center justify-between border-b border-brand-100 bg-brand-50 px-4">
      <div className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full bg-brand-600 ${isStreaming ? "animate-pulse" : ""}`}
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-brand-700">
          {modeLabels[activeMode]}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setActiveWritingMode(null)}
        aria-label="Dismiss writing mode"
        className="flex h-5 w-5 items-center justify-center text-brand-400 transition-colors hover:text-brand-600"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
