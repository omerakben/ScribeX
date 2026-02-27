"use client";

import { Activity, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routeToModel } from "@/lib/mercury/client";
import { useEditorStore } from "@/lib/store/editor-store";
import type { WritingMode } from "@/lib/types";

const modeLabels: Record<WritingMode, string> = {
  compose: "Compose",
  autocomplete: "Autocomplete",
  "quick-edit": "Quick Edit",
  "deep-rewrite": "Deep Rewrite",
  "next-edit": "Next Edit",
  review: "Review",
  "diffusion-draft": "Diffusion Draft",
};

export function WritingModeBar() {
  const activeMode = useEditorStore((s) => s.activeWritingMode);
  const isStreaming = useEditorStore((s) => s.isAIStreaming);
  const setActiveWritingMode = useEditorStore((s) => s.setActiveWritingMode);

  if (!activeMode) return null;

  const model = routeToModel(activeMode);

  return (
    <div className="flex h-10 items-center justify-between border-b border-mercury-200/70 bg-gradient-to-r from-mercury-50 to-brand-50 px-4 text-sm">
      <div className="inline-flex items-center gap-2.5">
        <span
          className={`h-2.5 w-2.5 rounded-full bg-mercury-500 ${isStreaming ? "animate-pulse-glow" : ""}`}
          aria-hidden="true"
        />
        <span className="font-semibold text-mercury-900">{modeLabels[activeMode]} active</span>
        <Badge variant="mercury" className="border border-mercury-300 bg-white text-[10px] uppercase tracking-[0.1em]">
          {model}
        </Badge>
        {isStreaming ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-mercury-800">
            <Activity className="h-3.5 w-3.5" />
            Streaming response
          </span>
        ) : null}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => setActiveWritingMode(null)}
        aria-label="Stop writing mode"
      >
        <X className="h-3.5 w-3.5" />
        Dismiss
      </Button>
    </div>
  );
}
