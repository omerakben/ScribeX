import type { Citation } from "@/lib/types";

/**
 * Generate a unique BibTeX-style citation key from a Citation object.
 * Appends a, b, c, ... when duplicates arise.
 */
export function generateCiteKey(
  citation: Citation,
  usedKeys: Map<string, number>
): string {
  let lastName = "unknown";
  if (citation.authors.length > 0) {
    const firstAuthor = citation.authors[0].name.trim();
    const parts = firstAuthor.split(/\s+/);
    lastName = parts[parts.length - 1].toLowerCase();
  }

  const yearPart = citation.year ? String(citation.year) : "nd";
  const baseKey = `${lastName}${yearPart}`.replace(/[^a-z0-9-]/g, "");

  const count = usedKeys.get(baseKey) ?? 0;
  usedKeys.set(baseKey, count + 1);

  if (count === 0) return baseKey;

  // Append a, b, c, ... for duplicates
  const suffix = String.fromCharCode(96 + count); // 1->a, 2->b, ...
  return `${baseKey}${suffix}`;
}
