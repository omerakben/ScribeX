"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Palette, Wand2, Search, X, Loader2, Wrench, Settings2, ChevronRight, Mic2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { AIDetectionBadge } from "@/components/editor/ai-detection-badge";
import { HumanizerPanel } from "@/components/editor/humanizer-panel";
import { ToneAnalysisCard } from "@/components/editor/tone-analysis-card";
import { structuredChatCompletion, applyEdit } from "@/lib/mercury/client";
import { getCommandPrompt, interpolatePrompt } from "@/lib/prompts";
import { getRawCommandPrompt } from "@/lib/prompts/loader";
import { getTemperature } from "@/lib/constants/temperatures";
import type { Editor } from "@tiptap/react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RibbonMode = "rewrite" | "stylize" | "humanize" | "detect" | "fix" | "custom" | "tone";

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
  fix: {
    label: "Fix Grammar",
    Icon: Wrench,
    accentColor: "brand",
  },
  custom: {
    label: "Custom",
    Icon: Settings2,
    accentColor: "mercury",
  },
  tone: {
    label: "Tone Analysis",
    Icon: Mic2,
    accentColor: "brand",
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

const RIBBON_WIDTH = 340;
const TRIGGER_HEIGHT = 44;
const RIBBON_GAP = 12;

function computeRibbonStyle(
  position: { top: number; left: number },
  isFlipped: boolean
): React.CSSProperties {
  const halfWidth = RIBBON_WIDTH / 2;
  const minLeft = halfWidth + 16;
  const maxLeft =
    typeof window !== "undefined"
      ? window.innerWidth - halfWidth - 16
      : halfWidth + 16;

  const clampedLeft = Math.max(minLeft, Math.min(position.left, maxLeft));
  const translateX = clampedLeft - position.left;

  const verticalOffset = isFlipped
    ? -(TRIGGER_HEIGHT / 2) - RIBBON_GAP
    : TRIGGER_HEIGHT / 2 + RIBBON_GAP;

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

// ─── Synonym/Rewrite result types ─────────────────────────────────────────────

interface SynonymGroup {
  definition: string;
  synonyms: string[];
}

interface SynonymGroupsResponse {
  synonymGroups: SynonymGroup[];
}

// ─── Schema for structured API calls ──────────────────────────────────────────

const SYNONYM_GROUPS_SCHEMA = {
  name: "synonym_groups",
  strict: true,
  schema: {
    type: "object",
    properties: {
      synonymGroups: {
        type: "array",
        items: {
          type: "object",
          properties: {
            definition: { type: "string" },
            synonyms: { type: "array", items: { type: "string" } },
          },
          required: ["definition", "synonyms"],
        },
      },
    },
    required: ["synonymGroups"],
  },
};

const CUSTOM_OPTIONS_SCHEMA = {
  name: "custom_options",
  strict: true,
  schema: {
    type: "object",
    properties: {
      options: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["options"],
  },
};

// ─── Rewrite/Synonym Content ──────────────────────────────────────────────────

interface RewriteContentProps {
  accentClasses: (typeof ACCENT_CLASSES)["brand" | "mercury"];
  groups: SynonymGroup[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  error: string | null;
  onGenerate: () => void;
  onMore: () => void;
  onApply: (text: string) => void;
}

function RewriteContent({
  accentClasses,
  groups,
  isLoading,
  hasMore,
  isLoadingMore,
  error,
  onGenerate,
  onMore,
  onApply,
}: RewriteContentProps) {
  return (
    <div className="space-y-3">
      {/* Error state */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
          {error}
        </p>
      )}

      {/* Empty + not loading */}
      {groups.length === 0 && !isLoading && !error && (
        <p className="text-xs text-ink-400 italic">
          Click Generate to create alternatives.
        </p>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-ink-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Generating alternatives…</span>
        </div>
      )}

      {/* Groups */}
      {groups.map((group, gi) => (
        <div key={gi} className="space-y-1">
          <p className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide px-1">
            {group.definition}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.synonyms.map((syn, si) => (
              <button
                key={si}
                type="button"
                onClick={() => onApply(syn)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border",
                  "bg-ink-50 text-ink-700 border-ink-200",
                  "hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200",
                  "transition-colors duration-150 focus:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1"
                )}
              >
                {syn}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isLoading}
          onClick={onGenerate}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg",
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
              Generate
            </>
          )}
        </button>

        {hasMore && (
          <button
            type="button"
            disabled={isLoadingMore}
            onClick={onMore}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg",
              "text-xs font-semibold border border-ink-200",
              "bg-white text-ink-600 hover:bg-ink-50",
              "transition-colors duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-ink-400",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoadingMore ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                More
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Stylize Content ──────────────────────────────────────────────────────────

interface StylizeContentProps {
  accentClasses: (typeof ACCENT_CLASSES)["brand" | "mercury"];
  selectedStyle: StyleChip | null;
  groups: SynonymGroup[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  error: string | null;
  onStyleSelect: (style: StyleChip) => void;
  onMore: () => void;
  onApply: (text: string) => void;
}

function StylizeContent({
  accentClasses,
  selectedStyle,
  groups,
  isLoading,
  hasMore,
  isLoadingMore,
  error,
  onStyleSelect,
  onMore,
  onApply,
}: StylizeContentProps) {
  return (
    <div className="space-y-3">
      {/* Style chips */}
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

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
          {error}
        </p>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-ink-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Applying {selectedStyle} style…</span>
        </div>
      )}

      {/* Results */}
      {groups.map((group, gi) => (
        <div key={gi} className="space-y-1">
          <p className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide px-1">
            {group.definition}
          </p>
          <div className="space-y-1">
            {group.synonyms.map((syn, si) => (
              <button
                key={si}
                type="button"
                onClick={() => onApply(syn)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-xs text-ink-700",
                  "border border-ink-100 bg-ink-50",
                  "hover:border-mercury-200 hover:bg-mercury-50 hover:text-mercury-700",
                  "transition-colors duration-150 focus:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-mercury-400 focus-visible:ring-offset-1"
                )}
              >
                {syn}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* More button */}
      {hasMore && !isLoading && (
        <button
          type="button"
          disabled={isLoadingMore}
          onClick={onMore}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg",
            "text-xs font-semibold border border-ink-200",
            "bg-white text-ink-600 hover:bg-ink-50",
            "transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-ink-400",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoadingMore ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              More variations
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Fix Content ──────────────────────────────────────────────────────────────

interface FixContentProps {
  accentClasses: (typeof ACCENT_CLASSES)["brand" | "mercury"];
  isLoading: boolean;
  fixedText: string | null;
  error: string | null;
  onFix: () => void;
  onApply: (text: string) => void;
}

function FixContent({
  accentClasses,
  isLoading,
  fixedText,
  error,
  onFix,
  onApply,
}: FixContentProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-500 leading-relaxed">
        Fixes grammar, spelling, and punctuation without changing your voice or structure.
      </p>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
          {error}
        </p>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-ink-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Checking for errors…</span>
        </div>
      )}

      {fixedText !== null && !isLoading && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
            Fixed version
          </p>
          <div className="rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-xs text-ink-700 leading-relaxed">
            {fixedText}
          </div>
          <button
            type="button"
            onClick={() => onApply(fixedText)}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg",
              "text-xs font-semibold transition-colors duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              accentClasses.generateBtn
            )}
          >
            Apply fix
          </button>
        </div>
      )}

      {fixedText === null && !isLoading && !error && (
        <button
          type="button"
          disabled={isLoading}
          onClick={onFix}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg",
            "text-xs font-semibold transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            accentClasses.generateBtn
          )}
        >
          <Wrench className="h-3.5 w-3.5" />
          Fix now
        </button>
      )}
    </div>
  );
}

// ─── Custom Content ───────────────────────────────────────────────────────────

interface CustomContentProps {
  accentClasses: (typeof ACCENT_CLASSES)["brand" | "mercury"];
  instruction: string;
  options: string[];
  isLoading: boolean;
  error: string | null;
  onInstructionChange: (val: string) => void;
  onSubmit: () => void;
  onApply: (text: string) => void;
}

function CustomContent({
  accentClasses,
  instruction,
  options,
  isLoading,
  error,
  onInstructionChange,
  onSubmit,
  onApply,
}: CustomContentProps) {
  return (
    <div className="space-y-3">
      {/* Instruction input */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
          Your instruction
        </label>
        <textarea
          value={instruction}
          onChange={(e) => onInstructionChange(e.target.value)}
          placeholder="e.g. Make this more concise, use active voice, add a transition..."
          rows={2}
          className={cn(
            "w-full px-3 py-2 rounded-lg text-xs text-ink-700",
            "border border-ink-200 bg-white",
            "placeholder:text-ink-300",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-mercury-400 focus-visible:ring-offset-1",
            "resize-none"
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
          {error}
        </p>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-ink-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Applying instruction…</span>
        </div>
      )}

      {/* Options */}
      {options.length > 0 && !isLoading && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
            Options — click to apply
          </p>
          {options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onApply(opt)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-xs text-ink-700",
                "border border-ink-100 bg-ink-50",
                "hover:border-mercury-200 hover:bg-mercury-50 hover:text-mercury-700",
                "transition-colors duration-150 focus:outline-none",
                "focus-visible:ring-2 focus-visible:ring-mercury-400 focus-visible:ring-offset-1"
              )}
            >
              <span className="font-semibold text-ink-400 mr-2 select-none tabular-nums">
                {i + 1}.
              </span>
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Submit button */}
      <button
        type="button"
        disabled={isLoading || !instruction.trim()}
        onClick={onSubmit}
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
            Applying…
          </>
        ) : (
          <>
            <Settings2 className="h-3.5 w-3.5" />
            Apply instruction
          </>
        )}
      </button>
    </div>
  );
}

// ─── Tone Content ─────────────────────────────────────────────────────────────

interface ToneContentProps {
  selectedText: string;
}

function ToneContent({ selectedText }: ToneContentProps) {
  return (
    <div className="space-y-3">
      {selectedText.trim().length >= 10 ? (
        <ToneAnalysisCard text={selectedText} />
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5">
          <Mic2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
          <p className="text-xs text-brand-600 leading-relaxed">
            Select at least a sentence to analyze its tone.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Detect Content ───────────────────────────────────────────────────────────

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

  const ribbonStyle = computeRibbonStyle(position, isFlipped);

  // ── Rewrite/Synonym state ───────────────────────────────────────
  const [rewriteGroups, setRewriteGroups] = useState<SynonymGroup[]>([]);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteLoadingMore, setRewriteLoadingMore] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const rewriteAbortRef = useRef<AbortController | null>(null);

  // ── Stylize state ──────────────────────────────────────────────
  const [selectedStyle, setSelectedStyle] = useState<StyleChip | null>(null);
  const [stylizeGroups, setStylizeGroups] = useState<SynonymGroup[]>([]);
  const [stylizeLoading, setStylizeLoading] = useState(false);
  const [stylizeLoadingMore, setStylizeLoadingMore] = useState(false);
  const [stylizeError, setStylizeError] = useState<string | null>(null);
  const stylizeAbortRef = useRef<AbortController | null>(null);

  // ── Fix state ──────────────────────────────────────────────────
  const [fixLoading, setFixLoading] = useState(false);
  const [fixedText, setFixedText] = useState<string | null>(null);
  const [fixError, setFixError] = useState<string | null>(null);
  const fixAbortRef = useRef<AbortController | null>(null);

  // ── Custom state ───────────────────────────────────────────────
  const [customInstruction, setCustomInstruction] = useState("");
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const customAbortRef = useRef<AbortController | null>(null);

  // ── Apply text to editor ───────────────────────────────────────
  const applyToEditor = useCallback(
    (text: string) => {
      editor
        .chain()
        .focus()
        .deleteRange(selectionRange)
        .insertContentAt(selectionRange.from, text)
        .run();
      toast.success("Text replaced", { duration: 2000 });
      onClose();
    },
    [editor, selectionRange, onClose]
  );

  // ── Synonym route selection ────────────────────────────────────
  const getSynonymPromptId = useCallback(() => {
    const isLong = selectedText.trim().split(/\s+/).length >= 5;
    const documentText = editor.getText();
    const hasContext = documentText.length > selectedText.length + 20;

    if (isLong) {
      return hasContext ? "synonym-long" : "synonym-long-no-context";
    }
    return hasContext ? "synonym" : "synonym-no-context";
  }, [selectedText, editor]);

  // ── Rewrite handlers ──────────────────────────────────────────
  const handleRewriteGenerate = useCallback(async () => {
    if (rewriteLoading) return;
    rewriteAbortRef.current?.abort();
    const controller = new AbortController();
    rewriteAbortRef.current = controller;

    setRewriteLoading(true);
    setRewriteError(null);
    setRewriteGroups([]);

    const promptId = getSynonymPromptId();
    const documentText = editor.getText();
    const vars: Record<string, string> = {
      text: selectedText,
      context: documentText,
    };
    const prompt = getCommandPrompt(promptId, vars);
    if (!prompt) {
      setRewriteError("Prompt not found.");
      setRewriteLoading(false);
      return;
    }

    try {
      const result = await structuredChatCompletion<SynonymGroupsResponse>(
        [{ role: "user", content: prompt }],
        SYNONYM_GROUPS_SCHEMA,
        {
          temperature: getTemperature("synonyms"),
          signal: controller.signal,
        }
      );
      setRewriteGroups(result.synonymGroups ?? []);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setRewriteError("Failed to generate alternatives. Please try again.");
        toast.error("Failed to generate alternatives", { duration: 3000 });
      }
    } finally {
      setRewriteLoading(false);
    }
  }, [rewriteLoading, getSynonymPromptId, selectedText, editor]);

  const handleRewriteMore = useCallback(async () => {
    if (rewriteLoadingMore || rewriteGroups.length === 0) return;
    rewriteAbortRef.current?.abort();
    const controller = new AbortController();
    rewriteAbortRef.current = controller;

    setRewriteLoadingMore(true);
    setRewriteError(null);

    const existingAlts = rewriteGroups
      .flatMap((g) => g.synonyms)
      .join("\n");
    const documentText = editor.getText();
    const prompt = getCommandPrompt("synonym-more", {
      text: selectedText,
      context: documentText,
      existing: existingAlts,
    });
    if (!prompt) {
      setRewriteLoadingMore(false);
      return;
    }

    try {
      const result = await structuredChatCompletion<SynonymGroupsResponse>(
        [{ role: "user", content: prompt }],
        SYNONYM_GROUPS_SCHEMA,
        {
          temperature: getTemperature("synonyms"),
          signal: controller.signal,
        }
      );
      setRewriteGroups((prev) => [...prev, ...(result.synonymGroups ?? [])]);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setRewriteError("Failed to generate more alternatives.");
        toast.error("Failed to generate more alternatives", { duration: 3000 });
      }
    } finally {
      setRewriteLoadingMore(false);
    }
  }, [rewriteLoadingMore, rewriteGroups, selectedText, editor]);

  // ── Stylize handlers ──────────────────────────────────────────
  const handleStyleSelect = useCallback(
    async (style: StyleChip) => {
      setSelectedStyle(style);
      stylizeAbortRef.current?.abort();
      const controller = new AbortController();
      stylizeAbortRef.current = controller;

      setStylizeLoading(true);
      setStylizeError(null);
      setStylizeGroups([]);

      const documentText = editor.getText();
      const hasContext = documentText.length > selectedText.length + 20;
      const promptId = hasContext ? "stylize" : "stylize-no-context";

      const prompt = getCommandPrompt(promptId, {
        text: selectedText,
        context: documentText,
        style,
      });
      if (!prompt) {
        setStylizeError("Prompt not found.");
        setStylizeLoading(false);
        return;
      }

      try {
        const result = await structuredChatCompletion<SynonymGroupsResponse>(
          [{ role: "user", content: prompt }],
          SYNONYM_GROUPS_SCHEMA,
          {
            temperature: getTemperature("stylize"),
            signal: controller.signal,
          }
        );
        setStylizeGroups(result.synonymGroups ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setStylizeError("Failed to apply style. Please try again.");
          toast.error("Failed to apply style", { duration: 3000 });
        }
      } finally {
        setStylizeLoading(false);
      }
    },
    [selectedText, editor]
  );

  const handleStylizeMore = useCallback(async () => {
    if (stylizeLoadingMore || !selectedStyle || stylizeGroups.length === 0) return;
    stylizeAbortRef.current?.abort();
    const controller = new AbortController();
    stylizeAbortRef.current = controller;

    setStylizeLoadingMore(true);
    setStylizeError(null);

    const existingAlts = stylizeGroups
      .flatMap((g) => g.synonyms)
      .join("\n");
    const documentText = editor.getText();
    const prompt = getCommandPrompt("stylize-more", {
      text: selectedText,
      context: documentText,
      style: selectedStyle,
      existing: existingAlts,
    });
    if (!prompt) {
      setStylizeLoadingMore(false);
      return;
    }

    try {
      const result = await structuredChatCompletion<SynonymGroupsResponse>(
        [{ role: "user", content: prompt }],
        SYNONYM_GROUPS_SCHEMA,
        {
          temperature: getTemperature("stylize"),
          signal: controller.signal,
        }
      );
      setStylizeGroups((prev) => [...prev, ...(result.synonymGroups ?? [])]);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setStylizeError("Failed to generate more variations.");
        toast.error("Failed to generate more variations", { duration: 3000 });
      }
    } finally {
      setStylizeLoadingMore(false);
    }
  }, [stylizeLoadingMore, selectedStyle, stylizeGroups, selectedText, editor]);

  // ── Fix handlers ──────────────────────────────────────────────
  const handleFix = useCallback(async () => {
    if (fixLoading) return;
    fixAbortRef.current?.abort();
    const controller = new AbortController();
    fixAbortRef.current = controller;

    setFixLoading(true);
    setFixError(null);
    setFixedText(null);

    const documentText = editor.getText();
    const selStart = selectionRange.from;
    const selEnd = selectionRange.to;

    // Get surrounding context (up to 200 chars before and after selection)
    const contextBefore = documentText.slice(Math.max(0, selStart - 200), selStart);
    const contextAfter = documentText.slice(selEnd, selEnd + 200);

    const rawPrompt = getRawCommandPrompt("fix");
    if (!rawPrompt) {
      setFixError("Fix prompt not found.");
      setFixLoading(false);
      return;
    }

    const instruction = interpolatePrompt(rawPrompt, {
      text: selectedText,
      contextBefore,
      contextAfter,
    });

    try {
      const result = await applyEdit(selectedText, instruction, {
        signal: controller.signal,
      });
      setFixedText(result);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setFixError("Failed to fix text. Please try again.");
        toast.error("Failed to fix text", { duration: 3000 });
      }
    } finally {
      setFixLoading(false);
    }
  }, [fixLoading, selectedText, editor, selectionRange]);

  // ── Custom handlers ───────────────────────────────────────────
  const handleCustomSubmit = useCallback(async () => {
    if (customLoading || !customInstruction.trim()) return;
    customAbortRef.current?.abort();
    const controller = new AbortController();
    customAbortRef.current = controller;

    setCustomLoading(true);
    setCustomError(null);
    setCustomOptions([]);

    const documentText = editor.getText();
    const hasContext = documentText.length > selectedText.length + 20;
    const promptId = hasContext ? "custom" : "custom-no-context";

    const prompt = getCommandPrompt(promptId, {
      text: selectedText,
      context: documentText,
      instruction: customInstruction.trim(),
    });
    if (!prompt) {
      setCustomError("Prompt not found.");
      setCustomLoading(false);
      return;
    }

    try {
      const result = await structuredChatCompletion<{ options: string[] }>(
        [{ role: "user", content: prompt }],
        CUSTOM_OPTIONS_SCHEMA,
        {
          temperature: getTemperature("rewrite", 0.6),
          signal: controller.signal,
        }
      );
      setCustomOptions(result.options ?? []);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setCustomError("Failed to apply instruction. Please try again.");
        toast.error("Failed to apply instruction", { duration: 3000 });
      }
    } finally {
      setCustomLoading(false);
    }
  }, [customLoading, customInstruction, selectedText, editor]);

  // ── Humanizer apply callback ──────────────────────────────────
  const handleHumanizeApply = useCallback(() => {
    // HumanizerPanel handles the editor replacement internally
  }, []);

  // ── Humanize mode renders the full HumanizerPanel ─────────────
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
            groups={rewriteGroups}
            isLoading={rewriteLoading}
            hasMore={rewriteGroups.length > 0}
            isLoadingMore={rewriteLoadingMore}
            error={rewriteError}
            onGenerate={handleRewriteGenerate}
            onMore={handleRewriteMore}
            onApply={applyToEditor}
          />
        )}

        {mode === "stylize" && (
          <StylizeContent
            accentClasses={accentClasses}
            selectedStyle={selectedStyle}
            groups={stylizeGroups}
            isLoading={stylizeLoading}
            hasMore={stylizeGroups.length > 0}
            isLoadingMore={stylizeLoadingMore}
            error={stylizeError}
            onStyleSelect={handleStyleSelect}
            onMore={handleStylizeMore}
            onApply={applyToEditor}
          />
        )}

        {mode === "detect" && <DetectContent selectedText={selectedText} />}

        {mode === "tone" && <ToneContent selectedText={selectedText} />}

        {mode === "fix" && (
          <FixContent
            accentClasses={accentClasses}
            isLoading={fixLoading}
            fixedText={fixedText}
            error={fixError}
            onFix={handleFix}
            onApply={applyToEditor}
          />
        )}

        {mode === "custom" && (
          <CustomContent
            accentClasses={accentClasses}
            instruction={customInstruction}
            options={customOptions}
            isLoading={customLoading}
            error={customError}
            onInstructionChange={setCustomInstruction}
            onSubmit={handleCustomSubmit}
            onApply={applyToEditor}
          />
        )}
      </div>
    </motion.div>
  );
}
