"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { analyzeReadability } from "@/lib/utils/readability";
import type { ReadabilityResult } from "@/lib/utils/readability";
import type { Editor } from "@tiptap/react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReadabilityBadgeProps {
  /** TipTap editor instance. The badge subscribes to update events internally. */
  editor: Editor;
  className?: string;
}

// ─── Grade visual config ──────────────────────────────────────────────────────

interface GradeConfig {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
}

const GRADE_CONFIG: Record<ReadabilityResult["grade"], GradeConfig> = {
  Easy: {
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
    dotColor: "bg-emerald-400",
  },
  Standard: {
    badgeBg: "bg-yellow-50",
    badgeText: "text-yellow-700",
    badgeBorder: "border-yellow-200",
    dotColor: "bg-yellow-400",
  },
  Hard: {
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-700",
    badgeBorder: "border-orange-200",
    dotColor: "bg-orange-400",
  },
  Complex: {
    badgeBg: "bg-red-50",
    badgeText: "text-red-600",
    badgeBorder: "border-red-200",
    dotColor: "bg-red-400",
  },
  "Very Complex": {
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    badgeBorder: "border-red-300",
    dotColor: "bg-red-600",
  },
};

// ─── Minimum text length before showing the badge ────────────────────────────

const MIN_TEXT_LENGTH = 10;

// ─── Stat row sub-component ───────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[11px] text-ink-500">{label}</span>
      <span className="text-[11px] font-semibold tabular-nums text-ink-700">
        {value}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ReadabilityBadge({ editor, className }: ReadabilityBadgeProps) {
  const [result, setResult] = useState<ReadabilityResult | null>(null);
  const [expanded, setExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Run analysis with 500ms debounce on each editor update.
    // Using editor.on() rather than useState-in-effect keeps lint clean.
    function scheduleAnalysis() {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        const text = editor.getText();
        if (!text || text.trim().length < MIN_TEXT_LENGTH) {
          setResult(null);
          return;
        }
        setResult(analyzeReadability(text));
      }, 500);
    }

    // Seed immediately so the badge appears on mount (existing content).
    scheduleAnalysis();

    editor.on("update", scheduleAnalysis);

    return () => {
      editor.off("update", scheduleAnalysis);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [editor]);

  if (!result) return null;

  const config = GRADE_CONFIG[result.grade];

  return (
    <div className={cn("relative", className)}>
      {/* ── Trigger pill ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
          "text-xs font-medium transition-colors duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1",
          config.badgeBg,
          config.badgeText,
          config.badgeBorder,
          "hover:brightness-95"
        )}
        aria-expanded={expanded}
        title={`Readability: ${result.grade} (Flesch ${result.score})`}
      >
        {/* Colored dot */}
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dotColor)}
        />
        <BookOpen className="h-3 w-3 shrink-0 opacity-70" />
        <span>{result.grade}</span>
        <span className="opacity-60 tabular-nums">{result.score}</span>
        {expanded ? (
          <ChevronUp className="h-3 w-3 opacity-50" />
        ) : (
          <ChevronDown className="h-3 w-3 opacity-50" />
        )}
      </button>

      {/* ── Popover detail panel ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute bottom-full right-0 mb-2 w-56",
              "rounded-xl border shadow-lg",
              "z-50",
              config.badgeBg,
              config.badgeBorder
            )}
          >
            {/* Header */}
            <div
              className={cn(
                "flex items-center gap-2 border-b px-3 py-2.5",
                config.badgeBorder
              )}
            >
              <span
                className={cn("h-2 w-2 rounded-full shrink-0", config.dotColor)}
              />
              <span className={cn("text-sm font-semibold", config.badgeText)}>
                {result.grade}
              </span>
              <span
                className={cn(
                  "ml-auto text-base font-bold tabular-nums",
                  config.badgeText
                )}
              >
                {result.score}
              </span>
            </div>

            {/* Stats grid */}
            <div className="space-y-1.5 px-3 py-2.5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                Flesch Reading Ease
              </p>
              <StatRow
                label="Sentences"
                value={result.sentenceCount.toLocaleString()}
              />
              <StatRow
                label="Words"
                value={result.wordCount.toLocaleString()}
              />
              <StatRow
                label="Syllables"
                value={result.syllableCount.toLocaleString()}
              />
              <div className="my-1.5 border-t border-ink-100" />
              <StatRow
                label="Avg words / sentence"
                value={result.avgWordsPerSentence.toFixed(1)}
              />
              <StatRow
                label="Avg syllables / word"
                value={result.avgSyllablesPerWord.toFixed(2)}
              />
            </div>

            {/* Grade scale legend */}
            <div className="border-t border-ink-100 px-3 py-2">
              <p className="text-[10px] leading-relaxed text-ink-400">
                80+ Easy &middot; 60 Standard &middot; 40 Hard &middot; 20
                Complex &middot; &lt;20 Very Complex
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
