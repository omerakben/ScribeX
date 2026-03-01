/**
 * HTML sanitizer for AI-generated content.
 * Pure function — no DOMParser dependency (SSR compatible).
 * Uses regex-based allowlist approach: strips disallowed tags and attributes.
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "b", "i", "u", "s",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "code", "pre",
  "a", "sup", "sub",
  "table", "thead", "tbody", "tr", "th", "td",
  "hr", "span", "div",
]);

// Only these attributes allowed, per-tag
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "class"]),
  th: new Set(["colspan", "rowspan", "class"]),
  td: new Set(["colspan", "rowspan", "class"]),
  span: new Set(["class"]),
  div: new Set(["class"]),
  code: new Set(["class"]),
  pre: new Set(["class"]),
};

// Protocols blocked in href values
const BLOCKED_PROTOCOLS = ["javascript:", "data:", "vbscript:"];

/**
 * Normalize a URL value for protocol checking.
 * Strips whitespace, decodes %xx sequences, lowercases.
 */
function normalizeUrl(raw: string): string {
  try {
    return decodeURIComponent(raw.trim().replace(/\s+/g, "")).toLowerCase();
  } catch {
    return raw.trim().toLowerCase();
  }
}

function isBlockedUrl(url: string): boolean {
  const normalized = normalizeUrl(url);
  return BLOCKED_PROTOCOLS.some((proto) => normalized.startsWith(proto));
}

/**
 * Parse a single HTML opening tag's attributes and return only the allowed ones.
 * Returns the rebuilt tag string (without < and >).
 */
function sanitizeTagAttrs(tagName: string, rawAttrs: string): string {
  const allowed = ALLOWED_ATTRS[tagName];
  if (!allowed || allowed.size === 0 || !rawAttrs.trim()) {
    return tagName;
  }

  // Match key="value", key='value', or key=value attribute patterns
  const attrPattern = /(\w[\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*)))?/g;
  const kept: string[] = [tagName];
  let match: RegExpExecArray | null;

  while ((match = attrPattern.exec(rawAttrs)) !== null) {
    const [, attrName, dqVal, sqVal, uqVal] = match;
    const name = attrName.toLowerCase();

    if (!allowed.has(name)) continue;

    // Get raw value (prefer double-quoted)
    const value = dqVal ?? sqVal ?? uqVal ?? "";

    // Block dangerous protocols in href
    if (name === "href" && isBlockedUrl(value)) continue;

    // Re-emit with double quotes (safe serialization)
    kept.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
  }

  return kept.join(" ");
}

/** Self-closing void elements that should not get a closing slash added */
const VOID_TAGS = new Set(["br", "hr"]);

/**
 * Process a single HTML tag (opening or self-closing).
 * Returns the sanitized tag or empty string if the tag is not allowed.
 */
function sanitizeOpenTag(fullMatch: string): string {
  // Match: <tagName ...attrs... /?>
  const match = fullMatch.match(/^<(\/?)(\w[\w-]*)([\s\S]*?)(\/?)\s*>$/);
  if (!match) return "";

  const [, slash, rawTag, rawAttrs, selfClose] = match;
  const tagName = rawTag.toLowerCase();

  // Closing tags — allow if tag is in allowlist, strip attrs
  if (slash === "/") {
    return ALLOWED_TAGS.has(tagName) ? `</${tagName}>` : "";
  }

  // Not in allowlist — strip the tag entirely (text content preserved by caller)
  if (!ALLOWED_TAGS.has(tagName)) return "";

  const isSelfClose = selfClose === "/" || VOID_TAGS.has(tagName);
  const rebuilt = sanitizeTagAttrs(tagName, rawAttrs);
  return isSelfClose ? `<${rebuilt} />` : `<${rebuilt}>`;
}

/**
 * Sanitize HTML string for safe rendering of AI-generated content.
 * - Strips all tags not in ALLOWED_TAGS (text content preserved)
 * - Strips all attributes not in ALLOWED_ATTRS per tag
 * - Blocks javascript:, data:, vbscript: in href attributes
 * - Removes script/style blocks entirely (including inner text)
 * - SSR compatible — no DOMParser used
 */
export function sanitizeHtml(html: string): string {
  if (!html) return html;

  // 1. Remove script blocks completely (content + tags)
  let result = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // 2. Remove style blocks completely
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // 3. Remove dangerous block elements entirely (content + tags)
  const dangerousBlockTags = "iframe|object|embed|form|input|button|select|textarea|meta|link|base";
  result = result.replace(
    new RegExp(`<(${dangerousBlockTags})\\b[^>]*>[\\s\\S]*?<\\/\\1>`, "gi"),
    ""
  );
  // Also strip self-closing / void variants
  result = result.replace(
    new RegExp(`<(${dangerousBlockTags})\\b[^>]*/?>`, "gi"),
    ""
  );

  // 4. Process remaining tags: allow or strip (preserve text content)
  result = result.replace(/<(\/?)(\w[\w-]*)((?:\s[^>]*)?)(\/?)>/gi, (fullMatch) => {
    return sanitizeOpenTag(fullMatch);
  });

  // 5. Strip any residual event handler attributes (belt-and-suspenders)
  result = result.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");

  return result;
}
