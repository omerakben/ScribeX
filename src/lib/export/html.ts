import type { Paper, Citation } from "@/lib/types";
import type { ExportOptions, ExportResult } from "@/lib/types/export";
import { PAPER_TEMPLATES, CITATION_STYLE_CATALOG } from "@/lib/constants";
import { downloadText } from "./download";
import { sanitizeHtml } from "./sanitize";

// ─── Helpers ──────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatAuthorName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map((p) => p.charAt(0).toUpperCase() + ".")
    .join(" ");
  return `${last}, ${initials}`;
}

function formatCitation(citation: Citation): string {
  const authors =
    citation.authors.length > 0
      ? citation.authors.map((a) => escapeHtml(formatAuthorName(a.name))).join(", ")
      : "Unknown Author";

  const year = citation.year ? ` (${citation.year}).` : ".";
  const title = ` <em>${escapeHtml(citation.title)}</em>.`;
  const venue = citation.venue ? ` ${escapeHtml(citation.venue)}.` : "";

  let doi = "";
  if (citation.doi) {
    const doiUrl = citation.doi.startsWith("http")
      ? citation.doi
      : `https://doi.org/${citation.doi}`;
    doi = ` DOI: <a href="${escapeHtml(doiUrl)}">${escapeHtml(citation.doi)}</a>`;
  }

  return `${authors}${year}${title}${venue}${doi}`;
}

// ─── Embedded CSS ─────────────────────────────────────────────

const EMBEDDED_CSS = `
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    -webkit-text-size-adjust: 100%;
    font-size: 16px;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Newsreader', 'Georgia', serif;
    font-size: 18px;
    line-height: 1.85;
    color: #1a1a2e;
    background: #ffffff;
    -webkit-font-smoothing: antialiased;
  }

  article.paper {
    max-width: 740px;
    margin: 0 auto;
    padding: 3rem 2rem 2rem;
  }

  /* ── Paper Header ── */

  .paper-header {
    text-align: center;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #e0e0e0;
  }

  .paper-title {
    font-family: 'Manrope', 'Helvetica Neue', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.3;
    color: #1a1a2e;
    margin: 0 0 0.75rem;
  }

  .paper-meta {
    font-family: 'Manrope', 'Helvetica Neue', sans-serif;
    font-size: 0.875rem;
    color: #6b7280;
    letter-spacing: 0.02em;
  }

  /* ── Content Typography ── */

  .paper-content h1,
  .paper-content h2,
  .paper-content h3,
  .paper-content h4,
  .paper-content h5,
  .paper-content h6 {
    font-family: 'Manrope', 'Helvetica Neue', sans-serif;
    font-weight: 700;
    color: #1a1a2e;
    margin-top: 2em;
    margin-bottom: 0.75em;
    line-height: 1.35;
  }

  .paper-content h1 { font-size: 2rem; }
  .paper-content h2 { font-size: 1.5rem; }
  .paper-content h3 { font-size: 1.25rem; }
  .paper-content h4 { font-size: 1.1rem; }
  .paper-content h5 { font-size: 1rem; font-weight: 600; }
  .paper-content h6 { font-size: 0.95rem; font-weight: 600; color: #4b5563; }

  .paper-content p {
    margin: 0 0 1.25em;
  }

  .paper-content a {
    color: #4338ca;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .paper-content a:hover {
    color: #3730a3;
  }

  /* ── Blockquotes ── */

  .paper-content blockquote {
    margin: 1.5em 0;
    padding: 0.75em 1.25em;
    border-left: 3px solid #c7d2fe;
    background: #f8f9fc;
    color: #4b5563;
    font-style: italic;
  }

  .paper-content blockquote p:last-child {
    margin-bottom: 0;
  }

  /* ── Lists ── */

  .paper-content ul,
  .paper-content ol {
    margin: 1em 0;
    padding-left: 1.75em;
  }

  .paper-content li {
    margin-bottom: 0.35em;
  }

  .paper-content li > ul,
  .paper-content li > ol {
    margin-top: 0.35em;
    margin-bottom: 0;
  }

  /* ── Code ── */

  .paper-content code {
    font-family: 'IBM Plex Mono', 'Menlo', monospace;
    font-size: 0.875em;
    background: #f3f4f6;
    color: #4338ca;
    padding: 0.15em 0.4em;
    border-radius: 4px;
  }

  .paper-content pre {
    margin: 1.5em 0;
    padding: 1.25em 1.5em;
    background: #1a1a2e;
    color: #e5e7eb;
    border-radius: 8px;
    overflow-x: auto;
    line-height: 1.6;
  }

  .paper-content pre code {
    background: none;
    color: inherit;
    padding: 0;
    border-radius: 0;
    font-size: 0.85em;
  }

  /* ── Tables ── */

  .paper-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5em 0;
    font-size: 0.95em;
  }

  .paper-content th,
  .paper-content td {
    border: 1px solid #d1d5db;
    padding: 0.6em 0.9em;
    text-align: left;
  }

  .paper-content th {
    font-family: 'Manrope', 'Helvetica Neue', sans-serif;
    font-weight: 600;
    background: #f9fafb;
    color: #1a1a2e;
  }

  .paper-content tr:nth-child(even) td {
    background: #f9fafb;
  }

  /* ── Images ── */

  .paper-content img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 1.5em auto;
    border-radius: 4px;
  }

  /* ── Horizontal Rule ── */

  .paper-content hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 2em 0;
  }

  /* ── Marks ── */

  .paper-content mark {
    background: #fef9c3;
    padding: 0.1em 0.2em;
    border-radius: 2px;
  }

  .paper-content sup {
    font-size: 0.75em;
    line-height: 0;
    position: relative;
    top: -0.5em;
    vertical-align: baseline;
  }

  .paper-content sub {
    font-size: 0.75em;
    line-height: 0;
    position: relative;
    top: 0.25em;
    vertical-align: baseline;
  }

  /* ── References ── */

  .references {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid #e0e0e0;
  }

  .references h2 {
    font-family: 'Manrope', 'Helvetica Neue', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1a2e;
    margin-top: 0;
    margin-bottom: 1.25rem;
  }

  .references ol {
    padding-left: 1.75em;
    margin: 0;
  }

  .references li {
    margin-bottom: 0.85em;
    line-height: 1.65;
    font-size: 0.95em;
    color: #374151;
  }

  .references a {
    color: #4338ca;
    text-decoration: underline;
    text-underline-offset: 2px;
    word-break: break-all;
  }

  /* ── Footer ── */

  .paper-footer {
    max-width: 740px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
    font-family: 'Manrope', 'Helvetica Neue', sans-serif;
    font-size: 0.8rem;
    color: #9ca3af;
    border-top: 1px solid #f3f4f6;
  }

  .paper-footer p {
    margin: 0;
  }

  /* ── KaTeX overrides ── */

  .Tiptap-mathematics-editor,
  .Tiptap-mathematics-render {
    display: inline;
  }

  .katex-display {
    margin: 1.5em 0;
  }

  /* ── Print Styles ── */

  @media print {
    @page {
      size: A4;
      margin: 1in;
    }

    body {
      font-size: 12pt;
      color: #000;
      background: #fff;
    }

    article.paper {
      max-width: none;
      padding: 0;
    }

    .paper-content a {
      color: #000;
      text-decoration: underline;
    }

    .paper-content pre {
      background: #f5f5f5;
      color: #000;
      border: 1px solid #ccc;
    }

    .paper-footer {
      font-size: 9pt;
    }

    .paper-content img {
      max-width: 100% !important;
    }
  }
`;

// ─── Main Export ──────────────────────────────────────────────

export async function exportHTML(
  paper: Paper,
  options: ExportOptions
): Promise<ExportResult> {
  const title = paper.title?.trim() || "Untitled Paper";
  const content = sanitizeHtml(paper.content || "");

  const templateLabel = PAPER_TEMPLATES[paper.template]?.label ?? paper.template;
  const citationLabel =
    CITATION_STYLE_CATALOG[paper.citationStyle?.id]?.shortLabel ??
    paper.citationStyle?.id ??
    "";
  const updatedDate = formatDate(paper.updatedAt);

  const metaParts = [templateLabel, citationLabel, `Updated: ${updatedDate}`].filter(
    Boolean
  );
  const metaLine = metaParts.join(" &middot; ");

  let referencesHtml = "";
  if (options.includeReferences && paper.references.length > 0) {
    const items = paper.references.map((ref) => `      <li>${formatCitation(ref)}</li>`).join("\n");
    referencesHtml = `
    <section class="references">
      <h2>References</h2>
      <ol>
${items}
      </ol>
    </section>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="generator" content="ScribeX">
  <meta name="date" content="${escapeHtml(paper.updatedAt)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;0,700;1,400&family=Manrope:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <style>${EMBEDDED_CSS}</style>
</head>
<body>
  <article class="paper">
    <header class="paper-header">
      <h1 class="paper-title">${escapeHtml(title)}</h1>
      <div class="paper-meta">${metaLine}</div>
    </header>
    <div class="paper-content tiptap">
      ${content}
    </div>${referencesHtml}
  </article>
  <footer class="paper-footer">
    <p>Exported from ScribeX on ${escapeHtml(updatedDate)}</p>
  </footer>
</body>
</html>`;

  downloadText(html, options.fileName, "text/html");

  return { success: true, fileName: options.fileName };
}
