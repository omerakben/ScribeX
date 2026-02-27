import type { Paper, Citation, Author } from "@/lib/types";
import type { ExportOptions, ExportResult } from "@/lib/types/export";
import { downloadText } from "./download";
import { generateCiteKey } from "./cite-utils";

// ─── BibTeX Special Character Escaping ─────────────────────────

const BIBTEX_ESCAPE_MAP: [RegExp, string][] = [
  [/\\/g, "\\textbackslash{}"],
  [/&/g, "\\&"],
  [/%/g, "\\%"],
  [/\$/g, "\\$"],
  [/#/g, "\\#"],
  [/_/g, "\\_"],
  [/\{/g, "\\{"],
  [/\}/g, "\\}"],
  [/~/g, "\\~{}"],
  [/\^/g, "\\^{}"],
];

function escapeBibTeX(value: string): string {
  let escaped = value;
  for (const [pattern, replacement] of BIBTEX_ESCAPE_MAP) {
    escaped = escaped.replace(pattern, replacement);
  }
  return escaped;
}

// ─── Author Formatting ─────────────────────────────────────────

function formatAuthorName(author: Author): string {
  const name = author.name.trim();
  if (!name) return "";

  const parts = name.split(/\s+/);
  if (parts.length === 1) {
    return parts[0];
  }

  const lastName = parts[parts.length - 1];
  const firstNames = parts.slice(0, -1).join(" ");
  return `${lastName}, ${firstNames}`;
}

function formatBibAuthors(authors: Author[]): string {
  if (authors.length === 0) return "{Unknown}";

  const formatted = authors
    .map(formatAuthorName)
    .filter((name) => name.length > 0);

  if (formatted.length === 0) return "{Unknown}";
  return formatted.join(" and ");
}

// ─── Entry Type Detection ───────────────────────────────────────

const INPROCEEDINGS_PATTERNS = /conference|proceedings|workshop/i;

function getEntryType(citation: Citation): "article" | "inproceedings" {
  if (citation.venue && INPROCEEDINGS_PATTERNS.test(citation.venue)) {
    return "inproceedings";
  }
  return "article";
}

// ─── Single BibTeX Entry ────────────────────────────────────────

function buildEntry(citation: Citation, citeKey: string): string {
  const entryType = getEntryType(citation);
  const fields: [string, string][] = [];

  // Title — double-braced to preserve capitalization
  fields.push(["title", `{{${escapeBibTeX(citation.title)}}}`]);

  // Author
  fields.push(["author", `{${formatBibAuthors(citation.authors)}}`]);

  // Year
  if (citation.year != null) {
    fields.push(["year", `{${citation.year}}`]);
  }

  // Venue → journal or booktitle
  if (citation.venue) {
    const venueField = entryType === "inproceedings" ? "booktitle" : "journal";
    fields.push([venueField, `{${escapeBibTeX(citation.venue)}}`]);
  }

  // DOI
  if (citation.doi) {
    fields.push(["doi", `{${escapeBibTeX(citation.doi)}}`]);
  }

  // URL
  if (citation.url) {
    fields.push(["url", `{${escapeBibTeX(citation.url)}}`]);
  }

  // Abstract
  if (citation.abstract) {
    fields.push(["abstract", `{${escapeBibTeX(citation.abstract)}}`]);
  }

  // Find the longest field name for alignment
  const maxFieldLen = Math.max(...fields.map(([name]) => name.length));

  const fieldLines = fields
    .map(([name, value]) => {
      const padded = name.padEnd(maxFieldLen);
      return `  ${padded} = ${value}`;
    })
    .join(",\n");

  return `@${entryType}{${citeKey},\n${fieldLines}\n}`;
}

// ─── File Header ────────────────────────────────────────────────

function buildHeader(paper: Paper): string {
  const lines = [
    "% Bibliography exported from ScribeX",
    `% Paper: ${paper.title}`,
    `% Citation style: ${paper.citationStyle.id}`,
    `% Exported: ${new Date().toISOString()}`,
    `% Total references: ${paper.references.length}`,
    "",
  ];
  return lines.join("\n");
}

// ─── Main Export Function ───────────────────────────────────────

export async function exportBibTeX(
  paper: Paper,
  options: ExportOptions
): Promise<ExportResult> {
  const fileName = options.fileName;

  if (paper.references.length === 0) {
    return {
      success: false,
      fileName,
      error: "No references to export. Add citations to your paper first.",
    };
  }

  const usedKeys = new Map<string, number>();

  const header = buildHeader(paper);
  const entries = paper.references.map((citation) => {
    const citeKey = generateCiteKey(citation, usedKeys);
    return buildEntry(citation, citeKey);
  });

  const bibtex = header + entries.join("\n\n") + "\n";

  downloadText(bibtex, fileName, "application/x-bibtex");

  return { success: true, fileName };
}
