import { marked } from "marked";
import { sanitizeHtml } from "./sanitize-html";

/**
 * Convert markdown from Mercury API responses into HTML
 * that TipTap can render as rich text.
 * Preserves LaTeX math delimiters so the Mathematics extension can pick them up.
 * Output is sanitized to prevent XSS from AI-generated content.
 */
export function markdownToHtml(md: string): string {
  if (!md.trim()) return md;

  // Protect LaTeX blocks from marked's processing
  const blockMathParts: string[] = [];
  let processed = md.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
    blockMathParts.push(latex);
    return `%%BLOCK_MATH_${blockMathParts.length - 1}%%`;
  });

  const inlineMathParts: string[] = [];
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (_, latex) => {
    inlineMathParts.push(latex);
    return `%%INLINE_MATH_${inlineMathParts.length - 1}%%`;
  });

  let html = marked.parse(processed, {
    async: false,
    gfm: true,
    breaks: false,
  }) as string;

  // Restore LaTeX — use extension's delimiter convention:
  // inline: $$...$$ (double), block: $$$...$$$ (triple)
  blockMathParts.forEach((latex, i) => {
    html = html.replace(`%%BLOCK_MATH_${i}%%`, `$$$${latex}$$$`);
  });
  inlineMathParts.forEach((latex, i) => {
    html = html.replace(`%%INLINE_MATH_${i}%%`, `$$${latex}$$`);
  });

  return sanitizeHtml(html);
}
