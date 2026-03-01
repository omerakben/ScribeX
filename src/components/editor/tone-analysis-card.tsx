"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Mic2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { structuredChatCompletion } from "@/lib/mercury/client";
import { getCommandPrompt } from "@/lib/prompts";
import { getTemperature } from "@/lib/constants/temperatures";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToneResult {
  tone: string;
  formality: "Formal" | "Semi-formal" | "Informal";
  sentiment: "Positive" | "Neutral" | "Negative" | "Mixed";
  confidence: number;
  suggestions: string[];
}

export interface ToneAnalysisCardProps {
  /** The text to analyze. Changing this resets analysis state. */
  text: string;
  className?: string;
}

type ToneState = "idle" | "analyzing" | "done" | "error";

// ─── JSON Schema for structured output ────────────────────────────────────────

const TONE_SCHEMA = {
  name: "tone_analysis",
  strict: true,
  schema: {
    type: "object",
    properties: {
      tone: { type: "string" },
      formality: { type: "string", enum: ["Formal", "Semi-formal", "Informal"] },
      sentiment: { type: "string", enum: ["Positive", "Neutral", "Negative", "Mixed"] },
      confidence: { type: "number" },
      suggestions: { type: "array", items: { type: "string" } },
    },
    required: ["tone", "formality", "sentiment", "confidence", "suggestions"],
    additionalProperties: false,
  },
};

// ─── Formality config ─────────────────────────────────────────────────────────

const FORMALITY_CONFIG: Record<ToneResult["formality"], { bg: string; text: string; border: string }> = {
  Formal: {
    bg: "bg-brand-50",
    text: "text-brand-700",
    border: "border-brand-200",
  },
  "Semi-formal": {
    bg: "bg-mercury-50",
    text: "text-mercury-700",
    border: "border-mercury-200",
  },
  Informal: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
};

// ─── Sentiment config ──────────────────────────────────────────────────────────

const SENTIMENT_CONFIG: Record<ToneResult["sentiment"], { bg: string; text: string; border: string; dot: string }> = {
  Positive: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-400",
  },
  Neutral: {
    bg: "bg-ink-100",
    text: "text-ink-600",
    border: "border-ink-200",
    dot: "bg-ink-400",
  },
  Negative: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-400",
  },
  Mixed: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnalyzingState() {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        className="flex items-center gap-2 text-brand-600"
      >
        <Mic2 className="h-5 w-5" />
        <span className="text-sm font-medium">Analyzing tone…</span>
      </motion.div>

      {/* Shimmer bar */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <motion.div
          className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-brand-400"
          animate={{ x: ["0%", "200%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

interface BadgeProps {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot?: string;
}

function Badge({ label, bg, text, border, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        bg,
        text,
        border
      )}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
      )}
      {label}
    </span>
  );
}

interface ConfidenceBarProps {
  confidence: number;
}

function ConfidenceBar({ confidence }: ConfidenceBarProps) {
  const pct = Math.round(confidence * 100);
  const barColor =
    pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Confidence
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-ink-500">
          {pct}%
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <motion.div
          className={cn("absolute inset-y-0 left-0 rounded-full", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

interface SuggestionsListProps {
  suggestions: string[];
}

function SuggestionsList({ suggestions }: SuggestionsListProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Lightbulb className="h-3 w-3 text-amber-500 shrink-0" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Suggestions
        </span>
      </div>
      <ul className="space-y-1.5 pl-1">
        {suggestions.map((s, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
            <p className="text-xs leading-relaxed text-ink-600">{s}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ToneAnalysisCard({
  text,
  className,
}: ToneAnalysisCardProps) {
  // Track which text was last analyzed to reset on text change
  const [analyzedText, setAnalyzedText] = useState(text);
  const [state, setState] = useState<ToneState>("idle");
  const [result, setResult] = useState<ToneResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(false);

  // Derive: if prop text differs from what we last analyzed, treat as idle
  const textIsFresh = analyzedText === text;
  const effectiveState = textIsFresh ? state : "idle";
  const effectiveResult = textIsFresh ? result : null;
  const effectiveError = textIsFresh ? error : null;
  const effectiveSuggestionsExpanded = textIsFresh ? suggestionsExpanded : false;

  const abortRef = useRef<AbortController | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!text.trim() || effectiveState === "analyzing") return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAnalyzedText(text);
    setState("analyzing");
    setError(null);
    setResult(null);
    setSuggestionsExpanded(false);

    try {
      const prompt = getCommandPrompt("analyze-tone", { text });
      if (!prompt) throw new Error("Tone analysis prompt not found.");

      const toneResult = await structuredChatCompletion<ToneResult>(
        [{ role: "user", content: prompt }],
        TONE_SCHEMA,
        {
          temperature: getTemperature("analyze-tone", 0.3),
          signal: controller.signal,
        }
      );

      if (controller.signal.aborted) return;
      setResult(toneResult);
      setState("done");
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(
        err instanceof Error ? err.message : "Tone analysis failed. Try again."
      );
      setState("error");
    }
  }, [text, effectiveState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // ── Idle state ──
  if (effectiveState === "idle") {
    return (
      <button
        type="button"
        onClick={runAnalysis}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl border",
          "border-brand-200 bg-brand-50 px-4 py-2.5",
          "text-sm font-medium text-brand-700",
          "transition-colors duration-150",
          "hover:bg-brand-100 hover:border-brand-300",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1",
          className
        )}
      >
        <Mic2 className="h-4 w-4" />
        Analyze tone
      </button>
    );
  }

  // ── Analyzing state ──
  if (effectiveState === "analyzing") {
    return (
      <div
        className={cn(
          "rounded-xl border border-brand-100 bg-brand-50 px-4 py-2",
          className
        )}
      >
        <AnalyzingState />
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
          onClick={runAnalysis}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium text-red-600",
            "hover:text-red-800 transition-colors"
          )}
        >
          <RotateCcw className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }

  // ── Done state ──
  if (!effectiveResult) return null;

  const formalityConfig = FORMALITY_CONFIG[effectiveResult.formality];
  const sentimentConfig = SENTIMENT_CONFIG[effectiveResult.sentiment];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-xl border border-ink-200 bg-white px-4 py-3 space-y-3 max-w-xs",
        className
      )}
    >
      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Mic2 className="h-4 w-4 shrink-0 text-brand-500" />
          <span className="text-sm font-semibold text-ink-900">Tone Analysis</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Re-analyze */}
          <button
            type="button"
            onClick={runAnalysis}
            title="Re-analyze"
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full",
              "text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            )}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Tone label ── */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Tone
        </span>
        <p className="text-sm font-medium text-ink-800 leading-snug capitalize">
          {effectiveResult.tone}
        </p>
      </div>

      {/* ── Formality + Sentiment badges ── */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          label={effectiveResult.formality}
          bg={formalityConfig.bg}
          text={formalityConfig.text}
          border={formalityConfig.border}
        />
        <Badge
          label={effectiveResult.sentiment}
          bg={sentimentConfig.bg}
          text={sentimentConfig.text}
          border={sentimentConfig.border}
          dot={sentimentConfig.dot}
        />
      </div>

      {/* ── Confidence bar ── */}
      <ConfidenceBar confidence={effectiveResult.confidence} />

      {/* ── Suggestions toggle ── */}
      {effectiveResult.suggestions.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setSuggestionsExpanded((v) => !v)}
            className={cn(
              "flex w-full items-center justify-between",
              "text-[11px] font-semibold uppercase tracking-wide text-ink-400",
              "hover:text-ink-600 transition-colors duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1 rounded"
            )}
          >
            <div className="flex items-center gap-1.5">
              <Lightbulb className="h-3 w-3 text-amber-500 shrink-0" />
              <span>Suggestions ({effectiveResult.suggestions.length})</span>
            </div>
            {effectiveSuggestionsExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          <AnimatePresence>
            {effectiveSuggestionsExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <SuggestionsList suggestions={effectiveResult.suggestions} />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── Disclaimer ── */}
      <p className="text-[10px] text-ink-400 leading-relaxed">
        AI-generated analysis — verify with your own judgment.
      </p>
    </motion.div>
  );
}
