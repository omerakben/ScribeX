/**
 * Selection disambiguation markers for AI writing assistance.
 *
 * When selected text appears multiple times in a document, the AI might
 * modify the wrong occurrence. These markers wrap the selected region so
 * the AI knows exactly which occurrence to act on — the same approach used
 * by VS Code Copilot, Cursor, and Aider.
 *
 * Pattern: <<<SELECTED>>>text<<<END_SELECTED>>>
 */

const SELECTION_START_MARKER = "<<<SELECTED>>>";
const SELECTION_END_MARKER = "<<<END_SELECTED>>>";

/**
 * Returns true when the selected text appears more than once in the document,
 * meaning position-based disambiguation is necessary before sending to the AI.
 */
export function hasAmbiguousSelection(
  documentText: string,
  selectedText: string
): boolean {
  if (!selectedText) return false;

  let count = 0;
  let searchStart = 0;

  while (searchStart <= documentText.length - selectedText.length) {
    const index = documentText.indexOf(selectedText, searchStart);
    if (index === -1) break;
    count++;
    if (count > 1) return true;
    searchStart = index + selectedText.length;
  }

  return false;
}

/**
 * Inserts disambiguation markers around the selected region of the document.
 *
 * The caller must supply character offsets (e.g. from TipTap's
 * `editor.state.selection.from` / `.to` after converting to plain-text
 * positions, or from a plain-text cursor range).
 *
 * Edge cases handled:
 * - Empty selection → document returned unchanged
 * - Selection at document start or end → markers placed at boundaries
 * - Multi-paragraph selection → markers wrap across newlines transparently
 * - Pre-existing markers in the document → escaped so the AI never sees
 *   ambiguous marker syntax
 *
 * @param documentText  Full plain-text content of the document
 * @param selectedText  The text that is currently selected (used for validation)
 * @param selectionStart  Zero-based start offset into documentText
 * @param selectionEnd    Zero-based end offset into documentText (exclusive)
 */
export function wrapSelection(
  documentText: string,
  selectedText: string,
  selectionStart: number,
  selectionEnd: number
): string {
  // Empty selection — nothing to wrap
  if (!selectedText || selectionStart === selectionEnd) {
    return documentText;
  }

  // Clamp offsets to valid range
  const start = Math.max(0, Math.min(selectionStart, documentText.length));
  const end = Math.max(start, Math.min(selectionEnd, documentText.length));

  // Slice first (offsets are against the original text), then escape each
  // segment independently. This preserves offset semantics while ensuring
  // pre-existing marker strings don't confuse the AI.
  const before = escapeExistingMarkers(documentText.slice(0, start));
  const selected = escapeExistingMarkers(documentText.slice(start, end));
  const after = escapeExistingMarkers(documentText.slice(end));

  return `${before}${SELECTION_START_MARKER}${selected}${SELECTION_END_MARKER}${after}`;
}


// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Escapes marker-like strings in the document so the AI won't confuse them
 * with the real selection delimiters.
 * Encoding: replace `<<<` with `\u2039\u2039\u2039` (single-angle quotation
 * mark, visually similar).
 */
function escapeExistingMarkers(text: string): string {
  return text
    .replaceAll(SELECTION_START_MARKER, "\u2039\u2039\u2039SELECTED\u203a\u203a\u203a")
    .replaceAll(SELECTION_END_MARKER, "\u2039\u2039\u2039END_SELECTED\u203a\u203a\u203a");
}

