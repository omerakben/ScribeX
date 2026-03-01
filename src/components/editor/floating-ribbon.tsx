"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Palette, Wand2, Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AIDetectionBadge } from "@/components/editor/ai-detection-badge";
import { HumanizerPanel } from "@/components/editor/humanizer-panel";
import type { Editor } from "@tiptap/react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RibbonMode = "rewrite" | "stylize" | "humanize" | "detect";

export interface FloatingRibbonProps {
  editor: Editor;
  mode: RibbonMode;
  selectedText: string;
  selectionRange: { from: number; to: number };
  position: { top: number; left: number };
  isFlipped: boolean;
  onClose: () => void;
}

// ─── Mode configuration ───────────────────────────────────────────────────────

interface ModeConfig {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  accentColor: "brand" | "mercury";
}

const MODE_CONFIG: Record<RibbonMode, ModeConfig> = {
  rewrite: {
    label: "Rewrite",
    Icon: RefreshCw,
    accentColor: "brand",
  },
  stylize: {
    label: "Stylize",
    Icon: Palette,
    accentColor: "mercury",
  },
  humanize: {
    label: "Humanize",
    Icon: Wand2,
    accentColor: "brand",
  },
  detect: {
    label: "AI Detection",
    Icon: Search,
    accentColor: "mercury",
  },
};

// ─── Style chip definitions for Stylize mode ──────────────────────────────────

const STYLE_CHIPS = [
  "Professional",
  "Creative",
  "Bold",
  "Minimal",
  "Academic",
  "Conversational",
  "Poetic",
  "Technical",
] as const;

type StyleChip = (typeof STYLE_CHIPS)[number];

// ─── Accent color class maps ──────────────────────────────────────────────────

const ACCENT_CLASSES = {
  brand: {
    icon: "text-brand-500",
    chipHoverBg: "hover:bg-brand-50",
    chipHoverText: "hover:text-brand-600",
    chipHoverBorder: "hover:border-brand-200",
    chipActiveBg: "bg-brand-500",
    chipActiveText: "text-white",
    chipActiveBorder: "border-brand-500",
    generateBtn:
      "bg-brand-500 hover:bg-brand-600 text-white focus-visible:ring-brand-400",
    scoreBg: "bg-mercury-50 text-mercury-700 border-mercury-200",
  },
  mercury: {
    icon: "text-mercury-500",
    chipHoverBg: "hover:bg-mercury-50",
    chipHoverText: "hover:text-mercury-600",
    chipHoverBorder: "hover:border-mercury-200",
    chipActiveBg: "bg-mercury-500",
    chipActiveText: "text-white",
    chipActiveBorder: "border-mercury-500",
    generateBtn:
      "bg-mercury-500 hover:bg-mercury-600 text-white focus-visible:ring-mercury-400",
    scoreBg: "bg-mercury-50 text-mercury-700 border-mercury-200",
  },
} as const;

// ─── Positioning helper ───────────────────────────────────────────────────────

const RIBBON_WIDTH = 320;
const TRIGGER_HEIGHT = 44; // approximate height of the floating menu trigger
const RIBBON_GAP = 12; // gap between trigger and ribbon

function computeRibbonStyle(
  position: { top: number; left: number },
  isFlipped: boolean
): React.CSSProperties {
  // Center horizontally on position.left, clamped so it doesn't overflow viewport
  const halfWidth = RIBBON_WIDTH / 2;
  const minLeft = halfWidth + 16;
  const maxLeft =
    typeof window !== "undefined"
      ? window.innerWidth - halfWidth - 16
      : halfWidth + 16;

  const clampedLeft = Math.max(minLeft, Math.min(position.left, maxLeft));
  const translateX = clampedLeft - position.left;

  // Vertical: below trigger (normal) or above trigger (flipped)
  // The floating menu itself is centered at position.top via translate(-50%,-50%),
  // so the trigger center is at position.top. We place the ribbon relative to
  // position.top, accounting for trigger half-height.
  const verticalOffset = isFlipped
    ? -(TRIGGER_HEIGHT / 2) - RIBBON_GAP // above: ribbon bottom edge sits above trigger top
    : TRIGGER_HEIGHT / 2 + RIBBON_GAP; // below: ribbon top edge sits below trigger bottom

  return {
    position: "absolute",
    top: position.top + verticalOffset,
    left: position.left + translateX,
    transform: isFlipped
      ? `translate(-50%, -100%)`
      : `translate(-50%, 0)`,
    width: RIBBON_WIDTH,
    maxWidth: "calc(100vw - 32px)",
    zIndex: 51,
  };
}

// ─── Sub-mode content components ─────────────────────────────────────────────

interface RewriteContentProps {
  accentClasses: (typeof ACCENT_CLASSES)["brand" | "mercury"];
  alternatives: string[];
  isLoading: boolean;
  onGenerate: () => void;
}

function RewriteContent({
  accentClasses,
  alternatives,
  isLoading,
  onGenerate,
}: RewriteContentProps) {
  return (
    <div className="space-y-3">
      {/* Alternatives list */}
      <div className="space-y-1.5">
        {alternatives.length === 0 && !isLoading && (
          <p className="text-xs text-ink-400 italic">
            No alternatives yet — click Generate to create some.
          </p>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-ink-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Generating alternatives…</span>
          </div>
        )}
        {alternatives.map((alt, i) => (
          <button
            key={i}
            type="button"
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-xs text-ink-700",
              "border border-ink-100 bg-ink-50",
              "hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700",
              "transition-colors duration-150 focus:outline-none",
              "focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1"
            )}
          >
            <span className="font-semibold text-ink-400 mr-2 select-none tabular-nums">
              {i + 1}.
            </span>
            {alt}
          </button>
        ))}
      </div>

      {/* Generate button */}
      <button
        type="button"
        disabled={isLoading}
        onClick={onGenerate}
        className={cn(
          "w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg",
          "text-xs font-semibold transition-colors duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          accentClasses.generateBtn
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <RefreshCw className="h-3.5 w-3.5" />
            Generate alternatives
          </>
        )}
      </button>
    </div>
  );
}

interface StylizeContentProps {
  accentClasses: (typeof ACCENT_CLASSES)["brand" | "mercury"];
  selectedStyle: StyleChip | null;
  onStyleSelect: (style: StyleChip) => void;
}

function StylizeContent({
  accentClasses,
  selectedStyle,
  onStyleSelect,
}: StylizeContentProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {STYLE_CHIPS.map((style) => {
        const isSelected = selectedStyle === style;
        return (
          <button
            key={style}
            type="button"
            onClick={() => onStyleSelect(style)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border",
              "transition-colors duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-mercury-400",
              isSelected
                ? [
                    accentClasses.chipActiveBg,
                    accentClasses.chipActiveText,
                    accentClasses.chipActiveBorder,
                  ]
                : [
                    "bg-ink-50 text-ink-600 border-ink-100",
                    accentClasses.chipHoverBg,
                    accentClasses.chipHoverText,
                    accentClasses.chipHoverBorder,
                  ]
            )}
          >
            {style}
          </button>
        );
      })}
    </div>
  );
}

interface DetectContentProps {
  selectedText: string;
}

function DetectContent({ selectedText }: DetectContentProps) {
  return (
    <div className="space-y-3">
      {selectedText.trim().length >= 10 ? (
        <AIDetectionBadge text={selectedText} />
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-mercury-100 bg-mercury-50 px-3 py-2.5">
          <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mercury-500" />
          <p className="text-xs text-mercury-600 leading-relaxed">
            Select at least a sentence to analyze for AI patterns.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FloatingRibbon({
  editor,
  mode,
  selectedText,
  selectionRange,
  position,
  isFlipped,
  onClose,
}: FloatingRibbonProps) {
  const config = MODE_CONFIG[mode];
  const accentClasses = ACCENT_CLASSES[config.accentColor];

  // Internal state for rewrite and stylize modes
  const [rewriteAlternatives] = useState<string[]>([]);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleChip | null>(null);

  const ribbonStyle = computeRibbonStyle(position, isFlipped);

  // Placeholder handlers for rewrite/stylize (TODO: wire AI in future phase)
  const handleRewriteGenerate = () => {
    setRewriteLoading(true);
    setTimeout(() => setRewriteLoading(false), 0);
  };

  const handleStyleSelect = (style: StyleChip) => {
    setSelectedStyle(style);
  };

  // Humanizer apply callback — closes the ribbon after applying
  const handleHumanizeApply = useCallback(() => {
    // HumanizerPanel handles the editor replacement internally,
    // so we just need to close the ribbon after a brief delay
  }, []);

  // ── Humanize mode renders the full HumanizerPanel ──
  if (mode === "humanize") {
    return (
      <div
        data-floating-menu
        style={ribbonStyle}
      >
        <HumanizerPanel
          editor={editor}
          selectedText={selectedText}
          selectionRange={selectionRange}
          context={editor.getText()}
          onClose={onClose}
          onApply={handleHumanizeApply}
        />
      </div>
    );
  }

  return (
    <motion.div
      data-floating-menu
      style={ribbonStyle}
      initial={{ opacity: 0, y: isFlipped ? -8 : 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: isFlipped ? -8 : 8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "rounded-2xl border border-ink-200 bg-white shadow-lg",
        "overflow-hidden"
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <config.Icon className={cn("h-4 w-4", accentClasses.icon)} />
          <span className="text-sm font-semibold text-ink-900">
            {config.label}
          </span>
        </div>

        <button
          type="button"
          aria-label="Close ribbon"
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

      {/* ── Content area ── */}
      <div className="px-4 py-3">
        {mode === "rewrite" && (
          <RewriteContent
            accentClasses={accentClasses}
            alternatives={rewriteAlternatives}
            isLoading={rewriteLoading}
            onGenerate={handleRewriteGenerate}
          />
        )}

        {mode === "stylize" && (
          <StylizeContent
            accentClasses={accentClasses}
            selectedStyle={selectedStyle}
            onStyleSelect={handleStyleSelect}
          />
        )}

        {mode === "detect" && <DetectContent selectedText={selectedText} />}
      </div>
    </motion.div>
  );
}
