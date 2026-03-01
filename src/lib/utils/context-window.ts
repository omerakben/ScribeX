import { MAX_EDITOR_CONTEXT_TOKENS } from "@/lib/constants";

// ─── Types ─────────────────────────────────────────────────────

export interface TruncationOptions {
  /** Full document text */
  documentText: string;
  /** Character offset of selection start */
  selectionStart: number;
  /** Character offset of selection end */
  selectionEnd: number;
  /** Token budget (default: MAX_EDITOR_CONTEXT_TOKENS) */
  maxTokens?: number;
}

export interface TruncatedContext {
  /** Truncated document text */
  text: string;
  /** Adjusted selection start offset within truncated text */
  selectionStart: number;
  /** Adjusted selection end offset within truncated text */
  selectionEnd: number;
  /** Whether truncation was applied */
  wasTruncated: boolean;
  /** Characters removed from each end (only present when truncated) */
  truncationInfo?: { removedBefore: number; removedAfter: number };
}

// ─── Token Estimation ──────────────────────────────────────────

/**
 * Rough token count estimate using a word-based heuristic.
 * Words longer than ~5 chars tend to span 2+ tokens; short words ~1 token.
 * Falls back to chars/4 for non-word content (code, math, symbols).
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;

  // Count words and estimate their token cost
  const wordMatches = text.match(/\b\w+\b/g);
  if (!wordMatches) {
    // Non-word heavy content (code, math) — chars/4 heuristic
    return Math.ceil(text.length / 4);
  }

  let wordTokens = 0;
  for (const word of wordMatches) {
    // Short words (≤4 chars) ≈ 1 token, longer words ≈ chars/4 rounded up
    wordTokens += word.length <= 4 ? 1 : Math.ceil(word.length / 4);
  }

  // Non-word characters (spaces, punctuation, symbols) add ~1 token per 4 chars
  const wordCharCount = wordMatches.reduce((sum, w) => sum + w.length, 0);
  const nonWordCharCount = text.length - wordCharCount;
  const nonWordTokens = Math.ceil(nonWordCharCount / 4);

  return wordTokens + nonWordTokens;
}

/**
 * Compute a dynamic token cap for short inputs.
 * Prevents over-fetching context for tiny selections.
 */
export function dynamicTokenCap(wordCount: number): number {
  return Math.max(64, wordCount * 10);
}

// ─── Paragraph Boundary Helpers ────────────────────────────────

/**
 * Find the nearest paragraph boundary at or before `pos`.
 * A paragraph boundary is a `\n\n` (or more newlines) sequence.
 * Returns the position immediately after the boundary, or 0 if none found.
 */
function nearestParagraphBoundaryBefore(text: string, pos: number): number {
  const slice = text.slice(0, pos);
  const match = slice.match(/[\s\S]*\n\n+/);
  if (!match) return 0;
  return match[0].length;
}

/**
 * Find the nearest paragraph boundary at or after `pos`.
 * Returns the position of the start of the boundary, or text.length if none.
 */
function nearestParagraphBoundaryAfter(text: string, pos: number): number {
  const idx = text.indexOf("\n\n", pos);
  return idx === -1 ? text.length : idx;
}

/**
 * Retreat to the nearest word boundary at or before `pos`.
 * Avoids splitting mid-word when paragraph boundaries are not available.
 */
function retreatToWordBoundary(text: string, pos: number): number {
  if (pos <= 0) return 0;
  // Walk back until we hit a whitespace character or reach the start
  let i = pos;
  while (i > 0 && !/\s/.test(text[i - 1])) {
    i--;
  }
  return i;
}

/**
 * Advance to the nearest word boundary at or after `pos`.
 */
function advanceToWordBoundary(text: string, pos: number): number {
  const len = text.length;
  if (pos >= len) return len;
  let i = pos;
  while (i < len && !/\s/.test(text[i])) {
    i++;
  }
  return i;
}

// ─── Main Truncation Logic ─────────────────────────────────────

/**
 * Truncate document text around the user's selection, centering the context
 * window so the AI has the most relevant surrounding text within the token budget.
 *
 * Split: 60% of budget before the selection, 40% after.
 * Boundary preference: paragraph breaks (\n\n) > word boundaries.
 */
export function truncateAroundSelection(options: TruncationOptions): TruncatedContext {
  const {
    documentText,
    maxTokens = MAX_EDITOR_CONTEXT_TOKENS,
  } = options;

  // Clamp selection offsets to valid range
  const docLen = documentText.length;
  const selStart = Math.max(0, Math.min(options.selectionStart, docLen));
  const selEnd = Math.max(selStart, Math.min(options.selectionEnd, docLen));

  // ── Edge case: empty document ──────────────────────────────
  if (docLen === 0) {
    return { text: "", selectionStart: 0, selectionEnd: 0, wasTruncated: false };
  }

  // ── Check if document fits in budget ──────────────────────
  const docTokens = estimateTokenCount(documentText);
  if (docTokens <= maxTokens) {
    return {
      text: documentText,
      selectionStart: selStart,
      selectionEnd: selEnd,
      wasTruncated: false,
    };
  }

  // ── Compute character budget ────────────────────────────────
  // Approximate chars from tokens using inverse of our heuristic (~4 chars/token)
  const charBudget = maxTokens * 4;

  const selectionLen = selEnd - selStart;

  // If the selection itself is larger than budget, clamp it
  if (selectionLen >= charBudget) {
    const clampedEnd = selStart + charBudget;
    const removedBefore = selStart;
    const removedAfter = docLen - clampedEnd;
    return {
      text: documentText.slice(selStart, clampedEnd),
      selectionStart: 0,
      selectionEnd: charBudget,
      wasTruncated: true,
      truncationInfo: { removedBefore, removedAfter },
    };
  }

  // Remaining budget after reserving space for the selection
  const remaining = charBudget - selectionLen;
  const budgetBefore = Math.floor(remaining * 0.6);
  const budgetAfter = remaining - budgetBefore;

  // ── Determine raw window boundaries ────────────────────────
  let windowStart = Math.max(0, selStart - budgetBefore);
  let windowEnd = Math.min(docLen, selEnd + budgetAfter);

  // ── Redistribute unused budget ──────────────────────────────
  // If we hit the document start, give unused before-budget to after, and vice versa
  const unusedBefore = budgetBefore - (selStart - windowStart);
  if (unusedBefore > 0) {
    windowEnd = Math.min(docLen, windowEnd + unusedBefore);
  }
  const unusedAfter = budgetAfter - (windowEnd - selEnd);
  if (unusedAfter > 0) {
    windowStart = Math.max(0, windowStart - unusedAfter);
  }

  // ── Snap to paragraph boundaries ───────────────────────────
  let finalStart = windowStart;
  let finalEnd = windowEnd;

  if (windowStart > 0) {
    const paragraphStart = nearestParagraphBoundaryBefore(documentText, windowStart);
    if (paragraphStart > 0 && paragraphStart <= windowStart) {
      finalStart = paragraphStart;
    } else {
      // Fall back to word boundary
      finalStart = retreatToWordBoundary(documentText, windowStart);
    }
  }

  if (windowEnd < docLen) {
    const paragraphEnd = nearestParagraphBoundaryAfter(documentText, windowEnd);
    if (paragraphEnd < docLen && paragraphEnd >= windowEnd) {
      finalEnd = paragraphEnd;
    } else {
      // Fall back to word boundary
      finalEnd = advanceToWordBoundary(documentText, windowEnd);
    }
  }

  // Clamp to document range
  finalStart = Math.max(0, finalStart);
  finalEnd = Math.min(docLen, finalEnd);

  const removedBefore = finalStart;
  const removedAfter = docLen - finalEnd;

  const truncatedText = documentText.slice(finalStart, finalEnd);
  const adjustedStart = selStart - finalStart;
  const adjustedEnd = selEnd - finalStart;

  return {
    text: truncatedText,
    selectionStart: adjustedStart,
    selectionEnd: adjustedEnd,
    wasTruncated: true,
    truncationInfo: { removedBefore, removedAfter },
  };
}
