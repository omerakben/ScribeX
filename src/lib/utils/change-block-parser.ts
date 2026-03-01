/**
 * Change block parser for AI-generated diff suggestions.
 *
 * Parses responses that interleave prose with fenced ```change blocks. Each
 * change block carries a `find:` field (the text to locate in the document)
 * and a `replace:` field (the replacement text — may be empty to mean deletion).
 *
 * Modelled after the AI Canvas ChangeBlockParser pattern.
 *
 * Example input:
 *   Here are my suggestions:
 *
 *   ```change
 *   find: The research demonstrates that climate change affects biodiversity significantly.
 *   replace: Research demonstrates significant climate change impacts on biodiversity.
 *   ```
 *
 *   I also recommend:
 *
 *   ```change
 *   find: In conclusion, the data shows
 *   replace: In conclusion, the data demonstrate
 *   ```
 */

// --- Types -----------------------------------------------------------------

export interface ChangeBlock {
  type: "change";
  /** The text to search for in the document. Always non-empty. */
  find: string;
  /** The replacement text. Empty string is valid -- means "delete this text". */
  replace: string;
}

export interface TextBlock {
  type: "text";
  /** Prose content surrounding the change blocks. May be empty. */
  content: string;
}

export type ParsedBlock = ChangeBlock | TextBlock;

// --- Regex -----------------------------------------------------------------

/**
 * Matches a fenced ```change ... ``` block.
 * The inner content capture group handles multi-line find/replace values.
 * The trailing ``` is non-greedy matched so consecutive blocks do not bleed.
 */
const CHANGE_BLOCK_REGEX = /```change\s*\n([\s\S]*?)```/g;

// --- Internal helpers -------------------------------------------------------

/**
 * Parse the inner content of a single change block fence into a ChangeBlock.
 * Returns null when the `find` field is missing or empty (invalid block).
 */
function parseBlockContent(content: string): ChangeBlock | null {
  const findMatch = content.match(/find:\s*([\s\S]*?)(?=\nreplace:|$)/i);
  const replaceMatch = content.match(/replace:\s*([\s\S]*)$/i);

  const find = findMatch ? findMatch[1].trim() : "";
  const replace = replaceMatch ? replaceMatch[1].trim() : "";

  // find must be non-empty -- without it we cannot locate the text in the doc
  if (!find) return null;

  return { type: "change", find, replace };
}

// --- Public API ------------------------------------------------------------

/**
 * Parse a full AI response into an ordered array of TextBlock and ChangeBlock
 * entries. Text segments that appear before, between, and after change blocks
 * are preserved as TextBlock entries (including empty ones, so callers can
 * reconstruct the original layout if needed).
 *
 * Invalid change blocks (missing or empty `find`) are silently dropped and the
 * surrounding text is merged back into the adjacent TextBlock.
 */
export function parseChangeBlocks(text: string): ParsedBlock[] {
  if (!text) return [{ type: "text", content: "" }];

  const blocks: ParsedBlock[] = [];
  let lastIndex = 0;

  // Reset regex state before each call (global regex retains lastIndex)
  CHANGE_BLOCK_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;

  while ((match = CHANGE_BLOCK_REGEX.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;
    const innerContent = match[1];

    // Text before this change block
    const preceding = text.slice(lastIndex, matchStart);
    blocks.push({ type: "text", content: preceding });

    // Attempt to parse the block content
    const changeBlock = parseBlockContent(innerContent);
    if (changeBlock !== null) {
      blocks.push(changeBlock);
    } else {
      // Invalid block -- fold the raw fenced text into a text block so nothing is lost
      blocks.push({ type: "text", content: match[0] });
    }

    lastIndex = matchEnd;
  }

  // Trailing text after the last change block (or the full text when no blocks exist)
  blocks.push({ type: "text", content: text.slice(lastIndex) });

  return blocks;
}

/**
 * Quick check: returns true when the text contains at least one syntactically
 * valid ```change block (i.e. a block whose `find` field is non-empty).
 */
export function hasChangeBlocks(text: string): boolean {
  if (!text) return false;

  CHANGE_BLOCK_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = CHANGE_BLOCK_REGEX.exec(text)) !== null) {
    if (parseBlockContent(match[1]) !== null) return true;
  }

  return false;
}

/**
 * Count the number of syntactically valid ```change blocks in the text.
 * Blocks with an empty or missing `find` field are excluded from the count.
 */
export function countChangeBlocks(text: string): number {
  if (!text) return 0;

  CHANGE_BLOCK_REGEX.lastIndex = 0;

  let count = 0;
  let match: RegExpExecArray | null;

  while ((match = CHANGE_BLOCK_REGEX.exec(text)) !== null) {
    if (parseBlockContent(match[1]) !== null) count++;
  }

  return count;
}
