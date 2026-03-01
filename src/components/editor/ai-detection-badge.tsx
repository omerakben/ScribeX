"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Shield, ChevronDown, ChevronUp, Loader2, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { detectAI } from "@/lib/detection/client";
import type { DetectionResponse, DetectionSentence } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIDetectionBadgeProps {
  /** The text to analyze. Changing this resets detection state. */
  text: string;
  /** Called once detection completes successfully. */
  onDetect?: (result: DetectionResponse) => void;
  className?: string;
}

type DetectionState = "idle" | "scanning" | "done" | "error";

// ─── Threshold helpers ────────────────────────────────────────────────────────

const THRESHOLDS = {
  human: 0.3,
  mixed: 0.6,
} as const;

function getLabel(score: number): DetectionResponse["label"] {
  if (score < THRESHOLDS.human) return "human";
  if (score < THRESHOLDS.mixed) return "mixed";
  return "ai";
}

// ─── Visual config per label ──────────────────────────────────────────────────

const LABEL_CONFIG = {
  human: {
    Icon: ShieldCheck,
    label: "Human",
    description: "This text reads as human-written.",
    badgeBg: "bg-emerald-50 border-emerald-200",
    badgeText: "text-emerald-700",
    barColor: "bg-emerald-400",
    sentenceHigh: "bg-emerald-100 border-emerald-200",
    sentenceLow: "bg-emerald-50 border-emerald-100",
  },
  mixed: {
    Icon: Shield,
    label: "Mixed",
    description: "This text shows both human and AI patterns.",
    badgeBg: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-700",
    barColor: "bg-amber-400",
    sentenceHigh: "bg-amber-100 border-amber-200",
    sentenceLow: "bg-amber-50 border-amber-100",
  },
  ai: {
    Icon: ShieldAlert,
    label: "AI",
    description: "This text shows strong AI-generated patterns.",
    badgeBg: "bg-red-50 border-red-200",
    badgeText: "text-red-700",
    barColor: "bg-red-400",
    sentenceHigh: "bg-red-100 border-red-200",
    sentenceLow: "bg-red-50 border-red-100",
  },
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScanningState() {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        className="flex items-center gap-2 text-mercury-600"
      >
        <ScanLine className="h-5 w-5" />
        <span className="text-sm font-medium">Analyzing text…</span>
      </motion.div>

      {/* Shimmer bar */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <motion.div
          className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-mercury-400"
          animate={{ x: ["0%", "200%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

interface ScoreMeterProps {
  score: number;
  label: DetectionResponse["label"];
}

function ScoreMeter({ score, label }: ScoreMeterProps) {
  const config = LABEL_CONFIG[label];
  const pct = Math.round(score * 100);

  return (
    <div className="space-y-1.5">
      {/* Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <motion.div
          className={cn("absolute inset-y-0 left-0 rounded-full", config.barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {/* Threshold markers */}
        <div
          className="absolute inset-y-0 w-px bg-ink-300 opacity-60"
          style={{ left: "30%" }}
        />
        <div
          className="absolute inset-y-0 w-px bg-ink-300 opacity-60"
          style={{ left: "60%" }}
        />
      </div>

      {/* Threshold labels */}
      <div className="flex text-[10px] text-ink-400 select-none">
        <span>Human</span>
        <span className="ml-[20%]">Mixed</span>
        <span className="ml-[22%]">AI</span>
      </div>
    </div>
  );
}

interface SentenceBreakdownProps {
  sentences: DetectionSentence[];
  label: DetectionResponse["label"];
}

function SentenceBreakdown({ sentences, label }: SentenceBreakdownProps) {
  if (sentences.length === 0) return null;
  const config = LABEL_CONFIG[label];

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
        Sentence breakdown
      </p>
      <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
        {sentences.map((s, i) => {
          const pct = Math.round(s.score * 100);
          const sentenceLabel = getLabel(s.score);
          const isHigh = s.score >= THRESHOLDS.mixed;

          return (
            <div
              key={i}
              className={cn(
                "rounded-lg border px-3 py-2",
                isHigh ? config.sentenceHigh : config.sentenceLow
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-ink-700 leading-relaxed line-clamp-2">
                  {s.text}
                </p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    LABEL_CONFIG[sentenceLabel].badgeBg,
                    LABEL_CONFIG[sentenceLabel].badgeText,
                    "border"
                  )}
                >
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AIDetectionBadge({
  text,
  onDetect,
  className,
}: AIDetectionBadgeProps) {
  // Combine all reset-able state into one object, keyed by text.
  // When text changes, we derive a reset via the textKey without calling
  // setState inside a useEffect (avoids the react-hooks/set-state-in-effect lint rule).
  const [analyzedText, setAnalyzedText] = useState(text);
  const [state, setState] = useState<DetectionState>("idle");
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Derive: if the prop text differs from what we last analyzed, treat as idle.
  const textIsFresh = analyzedText === text;
  const effectiveState = textIsFresh ? state : "idle";
  const effectiveResult = textIsFresh ? result : null;
  const effectiveError = textIsFresh ? error : null;
  const effectiveExpanded = textIsFresh ? expanded : false;

  const abortRef = useRef<AbortController | null>(null);

  const runDetection = useCallback(async () => {
    if (!text.trim() || effectiveState === "scanning") return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAnalyzedText(text);
    setState("scanning");
    setError(null);
    setResult(null);

    try {
      const detection = await detectAI(text, controller.signal);
      if (controller.signal.aborted) return;
      setResult(detection);
      setState("done");
      onDetect?.(detection);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(
        err instanceof Error ? err.message : "Detection failed. Try again."
      );
      setState("error");
    }
  }, [text, effectiveState, onDetect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // ── Idle state ──
  if (effectiveState === "idle") {
    return (
      <button
        type="button"
        onClick={runDetection}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl border",
          "border-mercury-200 bg-mercury-50 px-4 py-2.5",
          "text-sm font-medium text-mercury-700",
          "transition-colors duration-150",
          "hover:bg-mercury-100 hover:border-mercury-300",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-mercury-400 focus-visible:ring-offset-1",
          className
        )}
      >
        <ScanLine className="h-4 w-4" />
        Scan for AI patterns
      </button>
    );
  }

  // ── Scanning state ──
  if (effectiveState === "scanning") {
    return (
      <div
        className={cn(
          "rounded-xl border border-mercury-100 bg-mercury-50 px-4 py-2",
          className
        )}
      >
        <ScanningState />
      </div>
    );
  }

  // ── Error state ──
  if (effectiveState === "error") {
    return (
      <div
        className={cn(
          "space-y-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3",
          className
        )}
      >
        <p className="text-xs text-red-600">{effectiveError}</p>
        <button
          type="button"
          onClick={runDetection}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium text-red-600",
            "hover:text-red-800 transition-colors"
          )}
        >
          <Loader2 className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }

  // ── Done state ──
  if (!effectiveResult) return null;

  const config = LABEL_CONFIG[effectiveResult.label];
  const pct = Math.round(effectiveResult.score * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-xl border px-4 py-3 space-y-3",
        config.badgeBg,
        className
      )}
    >
      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <config.Icon className={cn("h-4 w-4 shrink-0", config.badgeText)} />
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={cn("text-base font-bold tabular-nums", config.badgeText)}>
                {pct}%
              </span>
              <span className={cn("text-xs font-semibold", config.badgeText)}>
                {config.label}
              </span>
            </div>
            <p className="text-[11px] text-ink-500 leading-tight">
              {config.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Re-scan */}
          <button
            type="button"
            onClick={runDetection}
            title="Re-scan"
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full",
              "text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-mercury-400"
            )}
          >
            <Loader2 className="h-3.5 w-3.5" />
          </button>

          {/* Expand/collapse breakdown */}
          {effectiveResult.sentences.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              title={effectiveExpanded ? "Hide breakdown" : "Show breakdown"}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full",
                "text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-mercury-400"
              )}
            >
              {effectiveExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Score meter ── */}
      <ScoreMeter score={effectiveResult.score} label={effectiveResult.label} />

      {/* ── Expandable sentence breakdown ── */}
      <AnimatePresence>
        {effectiveExpanded && effectiveResult.sentences.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <SentenceBreakdown
              sentences={effectiveResult.sentences}
              label={effectiveResult.label}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Disclaimer ── */}
      <p className="text-[10px] text-ink-400 leading-relaxed">
        Heuristic analysis only — scores are indicative, not definitive.
      </p>
    </motion.div>
  );
}
