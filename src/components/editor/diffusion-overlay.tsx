"use client";

import { useEditorStore } from "@/lib/store/editor-store";

export function DiffusionOverlay() {
  const isDiffusing = useEditorStore((s) => s.isDiffusing);
  const diffusionStep = useEditorStore((s) => s.diffusionStep);
  const diffusionContent = useEditorStore((s) => s.diffusionContent);

  if (!isDiffusing || !diffusionContent) return null;

  // Progressive denoising: blur decreases and opacity increases with each step
  // Mercury typically uses 8-20 denoising steps depending on complexity
  const estimatedTotal = 16;
  const progress = Math.min(diffusionStep / estimatedTotal, 1);
  const blurPx = Math.max(0, 3.5 * (1 - progress));
  const opacity = 0.35 + 0.65 * progress;

  return (
    <div className="diffusion-overlay relative mx-auto w-full max-w-[740px] px-16">
      <div className="bg-white px-16 py-6">
        {/* Denoising progress indicator */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-mercury-400 to-mercury-600 transition-all duration-200 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium tabular-nums text-mercury-600">
            Diffusing&hellip; {diffusionStep}
          </span>
        </div>

        {/* Diffusing text with blur-to-clear effect */}
        <div
          className="font-serif text-lg leading-relaxed text-ink-800 transition-[filter,opacity] duration-150 ease-out whitespace-pre-wrap"
          style={{
            filter: `blur(${blurPx}px)`,
            opacity,
          }}
        >
          {diffusionContent}
        </div>
      </div>
    </div>
  );
}
