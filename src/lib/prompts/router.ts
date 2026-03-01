/**
 * Context-aware prompt routing for ScribeX AI writing commands.
 *
 * Implements a 2x2 matrix routing strategy based on:
 * 1. Text length: short (< SHORT_TEXT_THRESHOLD) vs long (>= SHORT_TEXT_THRESHOLD)
 * 2. Context availability: document text present vs standalone selection only
 *
 * Routing cells:
 * ┌─────────────────┬──────────────────────┬──────────────────────┐
 * │                 │ Short Text           │ Long Text            │
 * ├─────────────────┼──────────────────────┼──────────────────────┤
 * │ With Context    │ short-context        │ long-context         │
 * ├─────────────────┼──────────────────────┼──────────────────────┤
 * │ No Context      │ short-standalone     │ long-standalone      │
 * └─────────────────┴──────────────────────┴──────────────────────┘
 */

import { getCommandPrompt } from "@/lib/prompts";
import { truncateAroundSelection } from "@/lib/utils/context-window";
import { wrapSelection, hasAmbiguousSelection } from "@/lib/utils/selection-markers";

// ─── Constants ────────────────────────────────────────────────

/** Character threshold separating "short" from "long" selected text. */
export const SHORT_TEXT_THRESHOLD = 500;

// ─── Types ────────────────────────────────────────────────────

export interface PromptRoutingContext {
  /** The slash command or action ID */
  action: string;
  /** The selected text (if any) */
  selectedText: string;
  /** Full document text (if available) */
  documentText?: string;
  /** Character offset of selection start */
  selectionStart?: number;
  /** Character offset of selection end */
  selectionEnd?: number;
}

export interface RoutedPrompt {
  /** The interpolated prompt ready to send */
  prompt: string;
  /** Which cell of the 2x2 matrix was used */
  routingCell:
    | "short-context"
    | "short-standalone"
    | "long-context"
    | "long-standalone";
  /** Whether the document was truncated */
  wasTruncated: boolean;
}

// ─── Main Router ──────────────────────────────────────────────

/**
 * Route a prompt to the appropriate 2x2 matrix cell based on text length
 * and context availability, then return the interpolated prompt.
 *
 * Returns undefined if the action ID is not recognized.
 */
export function routePrompt(ctx: PromptRoutingContext): RoutedPrompt | undefined {
  const { action, selectedText, documentText } = ctx;

  // ── Dimension 1: text length ────────────────────────────────
  const isShort = selectedText.length < SHORT_TEXT_THRESHOLD;

  // ── Dimension 2: context availability ───────────────────────
  const hasContext = typeof documentText === "string" && documentText.length > 0;

  // ── Determine routing cell ──────────────────────────────────
  const routingCell: RoutedPrompt["routingCell"] = isShort
    ? hasContext
      ? "short-context"
      : "short-standalone"
    : hasContext
    ? "long-context"
    : "long-standalone";

  // ── Build context string ────────────────────────────────────
  let contextStr = "";
  let wasTruncated = false;

  if (hasContext && documentText) {
    const selStart = ctx.selectionStart ?? 0;
    const selEnd = ctx.selectionEnd ?? documentText.length;

    // Truncate document around the selection if needed
    const truncated = truncateAroundSelection({
      documentText,
      selectionStart: selStart,
      selectionEnd: selEnd,
    });

    wasTruncated = truncated.wasTruncated;

    // Apply selection markers when text is ambiguous (appears more than once)
    if (
      selectedText &&
      hasAmbiguousSelection(truncated.text, selectedText)
    ) {
      contextStr = wrapSelection(
        truncated.text,
        selectedText,
        truncated.selectionStart,
        truncated.selectionEnd
      );
    } else {
      contextStr = truncated.text;
    }
  }

  // ── Edge case: neither selected text nor document text ──────
  // Return raw uninterpolated prompt so the caller can decide how to proceed
  if (!selectedText && !hasContext) {
    const rawPrompt = getCommandPrompt(action);
    if (rawPrompt === undefined) return undefined;
    return { prompt: rawPrompt, routingCell, wasTruncated: false };
  }

  // ── Interpolate ─────────────────────────────────────────────
  const prompt = getCommandPrompt(action, {
    context: contextStr,
    selectedText: selectedText ?? "",
  });

  if (prompt === undefined) return undefined;

  return { prompt, routingCell, wasTruncated };
}
