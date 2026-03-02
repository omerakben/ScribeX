import type { Paper, Citation } from "@/lib/types";
import type { ExportOptions, ExportResult } from "@/lib/types/export";
import { sanitizeHtml } from "@/lib/utils/sanitize-html";

// ─── Citation Formatter ───────────────────────────────────────

function formatCitationText(citation: Citation, index: number): string {
  const authors = citation.authors
    .map((a) => {
      const parts = a.name.split(" ");
      if (parts.length < 2) return a.name;
      const last = parts[parts.length - 1];
      const initials = parts
        .slice(0, -1)
        .map((p) => p.charAt(0).toUpperCase() + ".")
        .join(" ");
      return `${last}, ${initials}`;
    })
    .join(", ");

  const year = citation.year ? ` (${citation.year}).` : ".";
  const title = ` ${citation.title}.`;
  const venue = citation.venue ? ` <em>${citation.venue}</em>.` : "";
  const doi = citation.doi ? ` doi:${citation.doi}` : "";

  return `[${index + 1}] ${authors}${year}${title}${venue}${doi}`;
}

// ─── HTML Builder ─────────────────────────────────────────────

function buildPdfHtml(paper: Paper, options: ExportOptions): string {
  const date = new Date(paper.updatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const templateLabel = paper.template
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const citationLabel = paper.citationStyle.id
    .replace(/-/g, " ")
    .toUpperCase();

  let html = `
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .pdf-body {
    font-family: 'Newsreader', Georgia, 'Times New Roman', serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #000;
    background: #fff;
  }

  .pdf-title {
    font-family: 'Manrope', 'Helvetica Neue', Arial, sans-serif;
    font-size: 22pt;
    font-weight: 700;
    text-align: center;
    margin-bottom: 6pt;
    line-height: 1.3;
  }

  .pdf-meta {
    text-align: center;
    font-size: 9pt;
    color: #666;
    margin-bottom: 24pt;
    font-family: 'Manrope', 'Helvetica Neue', Arial, sans-serif;
  }

  .pdf-content h1 {
    font-family: 'Manrope', 'Helvetica Neue', Arial, sans-serif;
    font-size: 18pt;
    font-weight: 700;
    color: #000;
    margin: 20pt 0 8pt;
  }

  .pdf-content h2 {
    font-family: 'Manrope', 'Helvetica Neue', Arial, sans-serif;
    font-size: 15pt;
    font-weight: 700;
    color: #000;
    margin: 16pt 0 6pt;
  }

  .pdf-content h3 {
    font-family: 'Manrope', 'Helvetica Neue', Arial, sans-serif;
    font-size: 13pt;
    font-weight: 600;
    color: #000;
    margin: 14pt 0 4pt;
  }

  .pdf-content p {
    margin: 0 0 8pt;
    text-align: justify;
  }

  .pdf-content blockquote {
    border-left: 3pt solid #ccc;
    padding-left: 12pt;
    margin: 10pt 0;
    font-style: italic;
    color: #444;
  }

  .pdf-content pre {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8pt;
    font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace;
    font-size: 9pt;
    line-height: 1.4;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 8pt 0;
  }

  .pdf-content code {
    font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace;
    font-size: 9pt;
    background: #f5f5f5;
    padding: 1pt 3pt;
    border-radius: 2px;
  }

  .pdf-content pre code {
    background: none;
    padding: 0;
  }

  .pdf-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 10pt 0;
    font-size: 10pt;
  }

  .pdf-content th,
  .pdf-content td {
    border: 1px solid #999;
    padding: 5pt 8pt;
    text-align: left;
  }

  .pdf-content th {
    background: #f0f0f0;
    font-weight: 600;
  }

  .pdf-content img {
    max-width: 100%;
    height: auto;
    page-break-inside: avoid;
  }

  .pdf-content a {
    color: #000;
    text-decoration: underline;
  }

  .pdf-content ul, .pdf-content ol {
    margin: 6pt 0;
    padding-left: 20pt;
  }

  .pdf-content li {
    margin-bottom: 3pt;
  }

  /* Hide editor-only elements */
  .Tiptap-mathematics-editor,
  .mermaid-block__header,
  .mermaid-block__editor,
  .mermaid-block__error,
  .ghost-text {
    display: none !important;
  }

  /* Mermaid SVGs */
  .mermaid-block__svg svg {
    max-width: 100%;
    height: auto;
  }

  /* References */
  .pdf-references {
    margin-top: 30pt;
    page-break-before: auto;
  }

  .pdf-references h2 {
    font-family: 'Manrope', 'Helvetica Neue', Arial, sans-serif;
    font-size: 15pt;
    font-weight: 700;
    margin-bottom: 10pt;
    padding-bottom: 4pt;
    border-bottom: 1pt solid #ccc;
  }

  .pdf-references ol {
    list-style: none;
    padding: 0;
  }

  .pdf-references li {
    margin-bottom: 6pt;
    font-size: 10pt;
    line-height: 1.5;
    text-indent: -18pt;
    padding-left: 18pt;
  }
</style>

<div class="pdf-body">
  <div class="pdf-title">${escapeHtml(paper.title)}</div>
  <div class="pdf-meta">${templateLabel} &middot; ${citationLabel} &middot; ${date}</div>
  <div class="pdf-content">${sanitizeHtml(paper.content)}</div>`;

  // paper.content is trusted TipTap editor HTML from the local Zustand store,
  // not externally-submitted user input. It is rendered into an off-screen
  // container that is immediately removed after PDF generation.

  if (options.includeReferences && paper.references.length > 0) {
    const refItems = paper.references
      .map((ref, i) => `<li>${formatCitationText(ref, i)}</li>`)
      .join("\n      ");

    html += `
  <div class="pdf-references">
    <h2>References</h2>
    <ol>
      ${refItems}
    </ol>
  </div>`;
  }

  html += `
</div>`;

  return html;
}

// ─── HTML Escaping ────────────────────────────────────────────

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (c) => map[c]);
}

// ─── Color Sanitization ──────────────────────────────────────
// html2canvas (bundled in html2pdf.js) only supports rgb/rgba/hsl/hsla.
// Tailwind v4 emits oklch() colors in globals.css, and Chrome may
// serialize those as lab() in computed styles. We strip unsupported
// color functions from the cloned document before html2canvas renders.

const UNSUPPORTED_COLOR_RE =
  /(?:oklch|lab|lch|oklab|color)\([^)]*\)/gi;

/**
 * Replace unsupported CSS color functions with a safe fallback.
 * oklch/lab/lch/oklab/color() → transparent (or inherit for key props).
 */
function sanitizeCssText(cssText: string): string {
  return cssText.replace(UNSUPPORTED_COLOR_RE, "transparent");
}

/**
 * Strip or rewrite all stylesheets in a cloned document so html2canvas
 * never encounters oklch/lab/lch/oklab/color() values.
 */
function sanitizeClonedStyles(clonedDoc: Document): void {
  // Remove all <style> and <link rel="stylesheet"> that came from the
  // parent page (Tailwind v4, globals.css, etc.). The PDF HTML already
  // contains its own self-contained <style> block with only hex colors.
  const styles = clonedDoc.querySelectorAll(
    'style, link[rel="stylesheet"]'
  );
  styles.forEach((el) => {
    // Keep the PDF's own inline <style> (it lives inside .pdf-body's parent)
    const text = el.textContent ?? "";
    if (text.includes(".pdf-body") || text.includes(".pdf-title")) return;
    el.remove();
  });

  // As a safety net, rewrite any remaining inline style attributes
  const allElements = clonedDoc.querySelectorAll("[style]");
  allElements.forEach((el) => {
    const style = el.getAttribute("style");
    if (style) {
      const cleaned = sanitizeCssText(style);
      if (cleaned !== style) el.setAttribute("style", cleaned);
    }
  });
}

// ─── PDF Export ───────────────────────────────────────────────

export async function exportPDF(
  paper: Paper,
  options: ExportOptions
): Promise<ExportResult> {
  const html2pdf = (await import("html2pdf.js")).default;
  const pdfHtml = buildPdfHtml(paper, options);

  // Render inside a same-origin iframe so the source DOM is clean.
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:absolute;left:-9999px;top:0;width:210mm;height:0;border:none;";
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument!;
    iframeDoc.open();
    iframeDoc.write(
      `<!DOCTYPE html><html><head></head><body style="margin:0;padding:0;background:#fff;color:#000;width:210mm;">${pdfHtml}</body></html>`
    );
    iframeDoc.close();

    await html2pdf()
      .set({
        margin: [15, 15, 20, 15],
        filename: options.fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          backgroundColor: "#ffffff",
          // Strip unsupported color functions from the cloned document
          // before html2canvas attempts to parse them.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onclone: (_doc: Document, _el: HTMLElement) => {
            sanitizeClonedStyles(_doc);
          },
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
        pagebreak: {
          mode: ["avoid-all", "css", "legacy"],
          before: ".pdf-page-break-before",
          after: ".pdf-page-break-after",
          avoid: [
            "h1",
            "h2",
            "h3",
            "tr",
            "img",
            "pre",
            "blockquote",
            ".mermaid-block",
          ],
        },
      })
      .from(iframeDoc.body)
      .save();

    return { success: true, fileName: options.fileName };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "PDF generation failed";
    return { success: false, fileName: options.fileName, error: message };
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
}
