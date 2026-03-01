"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { countSyllables } from "@/lib/utils/readability";
import type { Editor } from "@tiptap/react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocumentStatsProps {
  editor: Editor;
  className?: string;
}

interface DocumentStatsResult {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTimeMin: number;
  avgSentenceLength: number;
  longestSentence: string;
  /** Percentages of words by syllable tier (sum to 100) */
  simpleWordPct: number;
  mediumWordPct: number;
  complexWordPct: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AVG_READING_WPM = 200;
const MIN_TEXT_LENGTH = 10;

// ─── Analysis ────────────────────────────────────────────────────────────────

function analyzeDocument(text: string): DocumentStatsResult | null {
  if (!text || text.trim().length < MIN_TEXT_LENGTH) return null;

  // Words
  const words = text.split(/\s+/).filter((w) => w.trim().length > 0);
  const wordCount = words.length;

  if (wordCount === 0) return null;

  // Sentences (split on . ! ?) — filter out empty fragments
  const rawSentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const sentenceCount = rawSentences.length;

  // Paragraphs: double-newline boundaries
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const paragraphCount = Math.max(1, paragraphs.length);

  // Reading time
  const readingTimeMin = Math.max(1, Math.round(wordCount / AVG_READING_WPM));

  // Avg sentence length
  const avgSentenceLength =
    sentenceCount > 0
      ? Math.round((wordCount / sentenceCount) * 10) / 10
      : wordCount;

  // Longest sentence
  let longestSentence = "";
  for (const s of rawSentences) {
    if (s.length > longestSentence.length) longestSentence = s;
  }
  // Truncate for display
  if (longestSentence.length > 80) {
    longestSentence = longestSentence.slice(0, 78) + "…";
  }

  // Syllable complexity distribution
  let simple = 0; // 1 syllable
  let medium = 0; // 2 syllables

  for (const w of words) {
    const syl = countSyllables(w);
    if (syl <= 1) simple++;
    else if (syl === 2) medium++;
  }

  const simpleWordPct = Math.round((simple / wordCount) * 100);
  const mediumWordPct = Math.round((medium / wordCount) * 100);
  // Force-sum to 100 by assigning remainder to complex
  const complexWordPct = 100 - simpleWordPct - mediumWordPct;

  return {
    wordCount,
    sentenceCount,
    paragraphCount,
    readingTimeMin,
    avgSentenceLength,
    longestSentence,
    simpleWordPct,
    mediumWordPct,
    complexWordPct,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

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

interface SyllableBarProps {
  label: string;
  pct: number;
  barClass: string;
}

function SyllableBar({ label, pct, barClass }: SyllableBarProps) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-ink-500">{label}</span>
        <span className="text-[10px] tabular-nums font-medium text-ink-600">
          {pct}%
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-ink-100 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", barClass)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DocumentStats({ editor, className }: DocumentStatsProps) {
  const [stats, setStats] = useState<DocumentStatsResult | null>(null);
  const [expanded, setExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function scheduleAnalysis() {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        const text = editor.getText();
        setStats(analyzeDocument(text));
      }, 500);
    }

    // Seed on mount for existing content
    scheduleAnalysis();

    editor.on("update", scheduleAnalysis);

    return () => {
      editor.off("update", scheduleAnalysis);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [editor]);

  if (!stats) return null;

  const readingLabel =
    stats.readingTimeMin === 1
      ? "1 min read"
      : `${stats.readingTimeMin} min read`;

  return (
    <div className={cn("relative", className)}>
      {/* ── Trigger pill ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
          "text-xs font-medium transition-colors duration-150",
          "bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1"
        )}
        aria-expanded={expanded}
        title="Document statistics"
      >
        <BarChart2 className="h-3 w-3 shrink-0 opacity-70" />
        <span>{readingLabel}</span>
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
              "absolute bottom-full right-0 mb-2 w-64",
              "rounded-xl border border-brand-200 bg-brand-50 shadow-lg",
              "z-50"
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-brand-200 px-3 py-2.5">
              <BarChart2 className="h-3.5 w-3.5 text-brand-500 shrink-0" />
              <span className="text-sm font-semibold text-brand-700">
                Document Stats
              </span>
              <span className="ml-auto text-xs text-brand-500 tabular-nums">
                {readingLabel}
              </span>
            </div>

            {/* Core counts */}
            <div className="space-y-1.5 px-3 py-2.5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                Structure
              </p>
              <StatRow
                label="Words"
                value={stats.wordCount.toLocaleString()}
              />
              <StatRow
                label="Sentences"
                value={stats.sentenceCount.toLocaleString()}
              />
              <StatRow
                label="Paragraphs"
                value={stats.paragraphCount.toLocaleString()}
              />

              <div className="my-1.5 border-t border-ink-100" />

              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                Sentence Analysis
              </p>
              <StatRow
                label="Avg sentence length"
                value={`${stats.avgSentenceLength} words`}
              />
              {stats.longestSentence && (
                <div className="rounded-md bg-brand-100 px-2 py-1.5 mt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-500 mb-0.5">
                    Longest sentence
                  </p>
                  <p className="text-[10px] leading-snug text-ink-600 italic">
                    &ldquo;{stats.longestSentence}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Syllable complexity */}
            <div className="border-t border-ink-100 px-3 py-2.5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                Word Complexity
              </p>
              <div className="space-y-2">
                <SyllableBar
                  label="Simple (1 syllable)"
                  pct={stats.simpleWordPct}
                  barClass="bg-emerald-400"
                />
                <SyllableBar
                  label="Medium (2 syllables)"
                  pct={stats.mediumWordPct}
                  barClass="bg-yellow-400"
                />
                <SyllableBar
                  label="Complex (3+ syllables)"
                  pct={stats.complexWordPct}
                  barClass="bg-red-400"
                />
              </div>
            </div>

            {/* Footer hint */}
            <div className="border-t border-ink-100 px-3 py-2">
              <p className="text-[10px] leading-relaxed text-ink-400">
                Avg {AVG_READING_WPM} wpm &middot; Higher simple % = more
                accessible prose
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
