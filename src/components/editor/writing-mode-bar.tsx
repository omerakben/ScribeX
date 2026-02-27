"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEditorStore } from "@/lib/store/editor-store";
import { routeToModel } from "@/lib/mercury/client";
import type { WritingMode } from "@/lib/types";

const MODE_LABELS: Record<WritingMode, string> = {
  compose: "Composing",
  autocomplete: "Autocomplete",
  "quick-edit": "Quick Edit",
  "deep-rewrite": "Deep Rewrite",
  "next-edit": "Next Edit",
  review: "Reviewing",
  "diffusion-draft": "Diffusion Draft",
};

export function WritingModeBar() {
  const activeWritingMode = useEditorStore((s) => s.activeWritingMode);
  const isAIStreaming = useEditorStore((s) => s.isAIStreaming);
  const setActiveWritingMode = useEditorStore((s) => s.setActiveWritingMode);

  if (!activeWritingMode) return null;

  const model = routeToModel(activeWritingMode);
  const modelLabel = model === "mercury-2" ? "Mercury 2" : "Mercury Edit";

  return (
    <div className="flex items-center justify-between h-8 px-4 border-b border-ink-200 bg-mercury-50 dark:bg-mercury-900/10 dark:border-ink-700">
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full bg-mercury-500 ${
            isAIStreaming ? "animate-pulse-glow" : ""
          }`}
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-mercury-800 dark:text-mercury-300">
          {MODE_LABELS[activeWritingMode]}
        </span>
        <Badge variant="mercury" className="text-[10px] px-1.5 py-0">
          {modelLabel}
        </Badge>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 text-ink-500 hover:text-ink-700"
        onClick={() => setActiveWritingMode(null)}
        aria-label="Cancel writing mode"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
