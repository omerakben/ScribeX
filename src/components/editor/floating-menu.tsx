"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, RefreshCw, Minimize2, GraduationCap, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { applyEdit, streamChatCompletion } from "@/lib/mercury/client";
import { routePrompt } from "@/lib/prompts/router";
import { getCommandPrompt } from "@/lib/prompts";
import { markdownToHtml } from "@/lib/utils/markdown-to-html";
import { useEditorStore } from "@/lib/store/editor-store";
import type { Editor } from "@tiptap/react";

// ─── Types ────────────────────────────────────────────────────

interface FloatingMenuProps {
  editor: Editor;
}

interface FloatingMenuState {
  isVisible: boolean;
  top: number;
  left: number;
  isFlipped: boolean;
  selectedText: string;
  selectionRange: { from: number; to: number } | null;
}

// ─── Action Definitions ────────────────────────────────────────

interface ActionButton {
  id: "rewrite" | "simplify" | "academic" | "expand";
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  hoverBg: string;
  hoverText: string;
  pos: { normal: { x: number; y: number }; flipped: { x: number; y: number } };
}

const ACTIONS: ActionButton[] = [
  {
    id: "rewrite",
    label: "Rewrite",
    Icon: RefreshCw,
    hoverBg: "hover:bg-brand-500",
    hoverText: "hover:text-white",
    pos: {
      normal: { x: -56, y: -28 },
      flipped: { x: -56, y: 28 },
    },
  },
  {
    id: "simplify",
    label: "Simplify",
    Icon: Minimize2,
    hoverBg: "hover:bg-brand-500",
    hoverText: "hover:text-white",
    pos: {
      normal: { x: -22, y: -58 },
      flipped: { x: -22, y: 58 },
    },
  },
  {
    id: "academic",
    label: "Academic",
    Icon: GraduationCap,
    hoverBg: "hover:bg-mercury-500",
    hoverText: "hover:text-white",
    pos: {
      normal: { x: 22, y: -58 },
      flipped: { x: 22, y: 58 },
    },
  },
  {
    id: "expand",
    label: "Expand",
    Icon: Maximize2,
    hoverBg: "hover:bg-brand-500",
    hoverText: "hover:text-white",
    pos: {
      normal: { x: 56, y: -28 },
      flipped: { x: 56, y: 28 },
    },
  },
];

// ─── Animation Variants ────────────────────────────────────────

const menuVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
      staggerChildren: 0.04,
    },
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.5, x: 0, y: 0 },
  visible: (pos: { x: number; y: number }) => ({
    opacity: 1,
    scale: 1,
    x: pos.x,
    y: pos.y,
    transition: { type: "spring" as const, stiffness: 400, damping: 22 },
  }),
  exit: { opacity: 0, scale: 0.5, x: 0, y: 0, transition: { duration: 0.12 } },
};

// ─── Component ────────────────────────────────────────────────

export function FloatingMenu({ editor }: FloatingMenuProps) {
  const isAIStreaming = useEditorStore((s) => s.isAIStreaming);
  const addAIMessage = useEditorStore((s) => s.addAIMessage);
  const updateLastAIMessage = useEditorStore((s) => s.updateLastAIMessage);

  const [menuState, setMenuState] = useState<FloatingMenuState>({
    isVisible: false,
    top: 0,
    left: 0,
    isFlipped: false,
    selectedText: "",
    selectionRange: null,
  });
  const [isFanOpen, setIsFanOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // ── Position & visibility tracking ─────────────────────────

  useEffect(() => {
    if (!editor) return;

    const updatePosition = () => {
      const { state } = editor;
      const { from, to } = state.selection;

      // Collapsed cursor — hide menu
      if (from === to) {
        setMenuState((prev) => ({ ...prev, isVisible: false }));
        setIsFanOpen(false);
        return;
      }

      const selectedText = state.doc.textBetween(from, to, " ");

      // Don't show when selection is empty or starts a slash command
      if (!selectedText.trim()) {
        setMenuState((prev) => ({ ...prev, isVisible: false }));
        setIsFanOpen(false);
        return;
      }

      // Guard: don't show when the slash command menu would be active
      // (selection starts with or contains a fresh "/" at line start)
      const textBefore = state.doc.textBetween(Math.max(0, from - 50), from, "\n");
      const lastSlash = textBefore.lastIndexOf("/");
      if (lastSlash !== -1) {
        const charBefore = lastSlash > 0 ? textBefore[lastSlash - 1] : "\n";
        const afterSlash = textBefore.slice(lastSlash + 1);
        if (
          (charBefore === "\n" || charBefore === " " || lastSlash === 0) &&
          !afterSlash.includes(" ") &&
          !afterSlash.includes("\n")
        ) {
          setMenuState((prev) => ({ ...prev, isVisible: false }));
          setIsFanOpen(false);
          return;
        }
      }

      // Compute position relative to .editor-scroll-area container
      const coords = editor.view.coordsAtPos(from);
      const scrollArea = editor.view.dom.closest(".editor-scroll-area");
      const editorRect = scrollArea?.getBoundingClientRect();

      if (!editorRect) return;

      // Place trigger at the start of the selection, baseline-aligned
      const rawLeft = coords.left - editorRect.left;
      const rawTop = coords.top - editorRect.top;

      // Flip below if the menu would go above the scroll area viewport
      const TRIGGER_SIZE = 44;
      const FAN_CLEARANCE = 80; // extra space needed for fanned items above
      const isFlipped = rawTop < FAN_CLEARANCE;

      // Clamp horizontally so it stays within the editor
      const clampedLeft = Math.max(
        TRIGGER_SIZE / 2,
        Math.min(rawLeft, editorRect.width - TRIGGER_SIZE / 2)
      );

      setMenuState({
        isVisible: true,
        top: rawTop,
        left: clampedLeft,
        isFlipped,
        selectedText,
        selectionRange: { from, to },
      });
    };

    editor.on("selectionUpdate", updatePosition);
    editor.on("update", updatePosition);

    return () => {
      editor.off("selectionUpdate", updatePosition);
      editor.off("update", updatePosition);
    };
  }, [editor]);

  // Close fan when clicking outside the floating menu
  useEffect(() => {
    if (!isFanOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsFanOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isFanOpen]);

  // ── Action handlers ────────────────────────────────────────

  const handleQuickEdit = useCallback(
    async (action: "simplify" | "academic") => {
      const { selectedText, selectionRange } = menuState;
      if (!selectionRange || !selectedText.trim()) return;

      setIsFanOpen(false);

      const store = useEditorStore.getState();
      store.setActiveWritingMode("quick-edit");
      store.setIsAIStreaming(true);

      const instruction = getCommandPrompt(action) ?? selectedText;

      try {
        const result = await applyEdit(selectedText, instruction);
        editor
          .chain()
          .focus()
          .deleteRange(selectionRange)
          .insertContentAt(selectionRange.from, markdownToHtml(result))
          .run();
      } catch {
        // Keep editor stable on failure
      }

      store.setIsAIStreaming(false);
      store.setActiveWritingMode(null);
    },
    [editor, menuState]
  );

  const handleStreamEdit = useCallback(
    async (action: "rewrite" | "expand") => {
      const { selectedText, selectionRange } = menuState;
      if (!selectionRange || !selectedText.trim()) return;

      setIsFanOpen(false);

      const store = useEditorStore.getState();
      const mode = action === "rewrite" ? "deep-rewrite" : "compose";
      store.setActiveWritingMode(mode);
      store.setIsAIStreaming(true);

      const documentText = editor.getText();
      const reasoningEffort =
        action === "rewrite"
          ? store.reasoningEffort === "instant" || store.reasoningEffort === "low"
            ? "high"
            : store.reasoningEffort
          : store.reasoningEffort;

      const routed = routePrompt({
        action,
        selectedText,
        documentText,
        selectionStart: selectionRange.from,
        selectionEnd: selectionRange.to,
      });
      const userPrompt =
        routed?.prompt ??
        getCommandPrompt(action, { context: selectedText }) ??
        selectedText;

      let accumulated = "";
      addAIMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        model: "mercury-2",
        timestamp: new Date().toISOString(),
        isStreaming: true,
      });

      await streamChatCompletion([{ role: "user", content: userPrompt }], {
        reasoningEffort,
        onChunk: (text) => {
          accumulated += text;
          updateLastAIMessage(accumulated);
        },
        onDone: () => {
          store.setIsAIStreaming(false);
          store.setActiveWritingMode(null);
          if (!accumulated.trim() || !selectionRange) return;

          if (action === "rewrite") {
            editor
              .chain()
              .focus()
              .deleteRange(selectionRange)
              .insertContentAt(selectionRange.from, markdownToHtml(accumulated))
              .run();
          } else {
            // Expand: insert after the selection
            editor
              .chain()
              .focus()
              .setTextSelection(selectionRange.to)
              .insertContent(markdownToHtml(accumulated))
              .run();
          }
        },
        onError: () => {
          store.setIsAIStreaming(false);
          store.setActiveWritingMode(null);
        },
      });
    },
    [editor, menuState, addAIMessage, updateLastAIMessage]
  );

  const handleAction = useCallback(
    (actionId: ActionButton["id"]) => {
      if (isAIStreaming) return;

      if (actionId === "simplify" || actionId === "academic") {
        handleQuickEdit(actionId);
      } else {
        handleStreamEdit(actionId);
      }
    },
    [isAIStreaming, handleQuickEdit, handleStreamEdit]
  );

  // ── Render ─────────────────────────────────────────────────

  if (!menuState.isVisible || isAIStreaming) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        key="floating-menu"
        data-floating-menu
        className="absolute z-50"
        style={{
          top: menuState.top,
          left: menuState.left,
          // Translate so the trigger center sits at (top, left)
          transform: "translate(-50%, -50%)",
        }}
        variants={menuVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* ── Action buttons (fan out from center) ── */}
        <AnimatePresence>
          {isFanOpen &&
            ACTIONS.map((action) => {
              const pos = menuState.isFlipped ? action.pos.flipped : action.pos.normal;
              return (
                <motion.div
                  key={action.id}
                  className="absolute"
                  style={{
                    // Center relative to the trigger
                    top: "50%",
                    left: "50%",
                    // Base translate to center the 36px button, then Framer adds x/y offset
                    marginTop: -18,
                    marginLeft: -18,
                  }}
                  variants={itemVariants}
                  custom={pos}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onMouseEnter={() => setActiveTooltip(action.id)}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <button
                    type="button"
                    aria-label={action.label}
                    disabled={isAIStreaming}
                    onClick={() => handleAction(action.id)}
                    className={cn(
                      "group relative flex h-9 w-9 items-center justify-center rounded-full",
                      "bg-ink-100 text-ink-600 shadow-sm",
                      "transition-colors duration-150 ease-out",
                      action.hoverBg,
                      action.hoverText,
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1"
                    )}
                  >
                    <action.Icon className="h-4 w-4" />

                    {/* Tooltip */}
                    {activeTooltip === action.id && (
                      <span
                        className={cn(
                          "pointer-events-none absolute whitespace-nowrap",
                          "rounded-md bg-ink-900 px-2 py-1",
                          "text-[11px] font-medium text-white shadow-lg",
                          // Position above or below depending on flip state and Y offset
                          menuState.isFlipped
                            ? "top-full mt-1.5 left-1/2 -translate-x-1/2"
                            : "bottom-full mb-1.5 left-1/2 -translate-x-1/2"
                        )}
                        role="tooltip"
                      >
                        {action.label}
                      </span>
                    )}
                  </button>
                </motion.div>
              );
            })}
        </AnimatePresence>

        {/* ── Central trigger button ── */}
        <button
          type="button"
          aria-label={isFanOpen ? "Close AI actions" : "Open AI actions"}
          aria-expanded={isFanOpen}
          disabled={isAIStreaming}
          onClick={() => setIsFanOpen((open) => !open)}
          className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-full",
            "bg-brand-600 text-white shadow-md",
            "transition-all duration-200 ease-out",
            "hover:bg-brand-500 hover:shadow-lg",
            "active:scale-95",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2",
            // Subtle pulse ring when closed (invites interaction)
            !isFanOpen && "ring-2 ring-brand-300/30"
          )}
        >
          <Sparkles
            className={cn(
              "h-5 w-5 transition-transform duration-200",
              isFanOpen && "rotate-45 scale-90"
            )}
          />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
