// ─── HTML Sanitization ──────────────────────────────────────────

/**
 * Lightweight regex-based HTML sanitizer that strips dangerous tags,
 * event handlers, and javascript: URLs from HTML strings.
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, "")
    .replace(/<(object|embed|form)\b[^>]*>.*?<\/\1>/gi, "")
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    .replace(/href\s*=\s*["']?\s*javascript:/gi, 'href="')
    .replace(/src\s*=\s*["']?\s*javascript:/gi, 'src="');
}
