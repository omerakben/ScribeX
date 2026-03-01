"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wand2, X, Loader2, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { humanizeText, humanizeOneMore } from "@/lib/mercury/client";
import type { Editor } from "@tiptap/react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HumanizerPanelProps {
  editor: Editor;
  selectedText: string;
  selectionRange: { from: number; to: number };
  context?: string;
  onClose: () => void;
  onApply: (text: string) => void;
}

// ─── Animation Variants ──────────────────────────────────────────────────────

const panelVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.96,
    transition: { duration: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.25,
      ease: "easeOut" as const,
    },
  }),
  exit: { opacity: 0, y: -8, transition: { duration: 0.12 } },
};

const newCardVariant = {
  hidden: { opacity: 0, height: 0, y: 16 },
  visible: {
    opacity: 1,
    height: "auto",
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

// ─── Skeleton Card ───────────────────────────────────────────────────────────

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-ink-100 bg-ink-50 p-3"
    >
      <div className="flex items-start gap-2.5">
        <div className="h-5 w-5 rounded-full bg-ink-200 animate-shimmer shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-3/4 rounded bg-ink-200 animate-shimmer" />
          <div className="h-3.5 w-full rounded bg-ink-200 animate-shimmer [animation-delay:75ms]" />
          <div className="h-3.5 w-1/2 rounded bg-ink-200 animate-shimmer [animation-delay:150ms]" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Alternative Card ────────────────────────────────────────────────────────

interface AlternativeCardProps {
  index: number;
  text: string;
  isApplied: boolean;
  onSelect: () => void;
}

function AlternativeCard({ index, text, isApplied, onSelect }: AlternativeCardProps) {
  return (
    <motion.button
      layout
      type="button"
      onClick={onSelect}
      disabled={isApplied}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "w-full text-left rounded-xl border p-3 transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1",
        isApplied
          ? "border-emerald-300 bg-emerald-50 cursor-default"
          : "border-ink-100 bg-white hover:border-brand-200 hover:bg-brand-50 cursor-pointer"
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Number badge or checkmark */}
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
            isApplied
              ? "bg-emerald-500 text-white"
              : "bg-brand-100 text-brand-600"
          )}
        >
          {isApplied ? (
            <Check className="h-3 w-3" />
          ) : (
            index + 1
          )}
        </span>

        {/* Text content */}
        <p
          className={cn(
            "text-sm leading-relaxed",
            isApplied ? "text-emerald-700" : "text-ink-700"
          )}
        >
          {text}
        </p>
      </div>
    </motion.button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function HumanizerPanel({
  editor,
  selectedText,
  selectionRange,
  context,
  onClose,
  onApply,
}: HumanizerPanelProps) {
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Initial batch generation ────────────────────────────────────────────

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    async function fetchInitial() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await humanizeText(selectedText, {
          context,
          count: 4,
          signal: controller.signal,
        });
        setAlternatives(response.alternatives);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("Failed to generate alternatives. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchInitial();

    return () => {
      controller.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generate one more ──────────────────────────────────────────────────

  const handleGenerateMore = useCallback(async () => {
    if (isLoadingMore) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoadingMore(true);
    setError(null);

    try {
      const temperature = 0.9 + 0.15 * alternatives.length;
      const response = await humanizeOneMore(selectedText, alternatives, {
        temperature,
        signal: controller.signal,
      });
      setAlternatives((prev) => [...prev, response.alternative]);

      // Scroll to bottom after new card appears
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError("Failed to generate. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, alternatives, selectedText]);

  // ── Apply an alternative ───────────────────────────────────────────────

  const handleSelect = useCallback(
    (index: number) => {
      if (appliedIndex !== null) return;

      const text = alternatives[index];
      setAppliedIndex(index);

      // Replace selected text in editor
      editor
        .chain()
        .focus()
        .deleteRange({ from: selectionRange.from, to: selectionRange.to })
        .insertContentAt(selectionRange.from, text)
        .run();

      onApply(text);

      // Brief delay to show checkmark, then close
      setTimeout(() => {
        onClose();
      }, 600);
    },
    [alternatives, appliedIndex, editor, selectionRange, onApply, onClose]
  );

  // ── Keyboard dismiss ──────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // ── Cleanup on unmount ────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      <motion.div
        data-floating-menu
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn(
          "w-[360px] max-w-[calc(100vw-32px)]",
          "rounded-2xl border border-ink-200 bg-white shadow-lg",
          "overflow-hidden"
        )}
        style={{ zIndex: 52 }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-brand-500" />
            <span className="text-sm font-semibold text-ink-900">
              Humanize
            </span>
            {alternatives.length > 0 && (
              <span className="text-xs text-ink-400">
                {alternatives.length} alternative{alternatives.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label="Close humanizer"
            onClick={onClose}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full",
              "text-ink-400 transition-colors duration-150",
              "hover:bg-ink-100 hover:text-ink-600",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1"
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ── Selected text preview ── */}
        <div className="border-b border-ink-100 px-4 py-2">
          <p className="text-xs text-ink-400 font-medium mb-1">Original text</p>
          <p className="text-xs text-ink-600 leading-relaxed line-clamp-3">
            {selectedText}
          </p>
        </div>

        {/* ── Alternatives list ── */}
        <div
          ref={scrollRef}
          className="px-3 py-3 space-y-2 max-h-[320px] overflow-y-auto"
        >
          {/* Loading skeletons for initial batch */}
          {isLoading && (
            <>
              {[0, 1, 2, 3].map((i) => (
                <SkeletonCard key={i} index={i} />
              ))}
            </>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Alternative cards */}
          {!isLoading && alternatives.length === 0 && !error && (
            <p className="text-xs text-ink-400 italic text-center py-4">
              No alternatives generated. Try again.
            </p>
          )}

          <AnimatePresence mode="popLayout">
            {alternatives.map((alt, i) => (
              <motion.div
                key={`alt-${i}`}
                layout
                variants={i >= 4 ? newCardVariant : undefined}
                initial={i >= 4 ? "hidden" : undefined}
                animate={i >= 4 ? "visible" : undefined}
              >
                <AlternativeCard
                  index={i}
                  text={alt}
                  isApplied={appliedIndex === i}
                  onSelect={() => handleSelect(i)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator for "more" */}
          {isLoadingMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 py-2"
            >
              <Loader2 className="h-4 w-4 animate-spin text-mercury-500" />
              <span className="text-xs text-ink-400">Generating alternative...</span>
            </motion.div>
          )}
        </div>

        {/* ── Footer with Generate More ── */}
        {!isLoading && appliedIndex === null && (
          <div className="border-t border-ink-100 px-3 py-2.5">
            <button
              type="button"
              disabled={isLoadingMore}
              onClick={handleGenerateMore}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg",
                "text-xs font-semibold transition-all duration-150",
                "bg-mercury-500 hover:bg-mercury-600 text-white",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-mercury-400 focus-visible:ring-offset-1",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                !isLoadingMore && "hover:shadow-sm"
              )}
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Generate More
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
