import TurndownService from "turndown";
import type { Paper } from "@/lib/types";
import type { ExportOptions, ExportResult } from "@/lib/types/export";
import { downloadText } from "./download";

function createTurndownService(): TurndownService {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
    strongDelimiter: "**",
  });

  // --- Inline math: <span data-type="inline-math" data-latex="..."> ---
  turndown.addRule("inlineMath", {
    filter(node) {
      return (
        node.nodeName === "SPAN" &&
        (node as HTMLElement).getAttribute("data-type") === "inline-math"
      );
    },
    replacement(_content, node) {
      const latex = (node as HTMLElement).getAttribute("data-latex") ?? "";
      return latex ? `$${latex}$` : "";
    },
  });

  // --- Block math: <div data-type="block-math" data-latex="..."> ---
  turndown.addRule("blockMath", {
    filter(node) {
      return (
        node.nodeName === "DIV" &&
        (node as HTMLElement).getAttribute("data-type") === "block-math"
      );
    },
    replacement(_content, node) {
      const latex = (node as HTMLElement).getAttribute("data-latex") ?? "";
      return latex ? `\n\n$$\n${latex}\n$$\n\n` : "";
    },
  });

  // --- Mermaid: <div data-type="mermaid-block" content="..."> ---
  turndown.addRule("mermaidBlock", {
    filter(node) {
      return (
        node.nodeName === "DIV" &&
        (node as HTMLElement).getAttribute("data-type") === "mermaid-block"
      );
    },
    replacement(_content, node) {
      const source = (node as HTMLElement).getAttribute("content") ?? "";
      return source.trim()
        ? `\n\n\`\`\`mermaid\n${source.trim()}\n\`\`\`\n\n`
        : "";
    },
  });

  // --- Superscript: <sup> → ^text^ ---
  turndown.addRule("superscript", {
    filter: "sup",
    replacement(content) {
      return content ? `^${content}^` : "";
    },
  });

  // --- Subscript: <sub> → ~text~ ---
  turndown.addRule("subscript", {
    filter: "sub",
    replacement(content) {
      return content ? `~${content}~` : "";
    },
  });

  // --- Strikethrough: <s> or <del> → ~~text~~ ---
  turndown.addRule("strikethrough", {
    filter: ["s", "del"],
    replacement(content) {
      return content ? `~~${content}~~` : "";
    },
  });

  // --- Underline: <u> → <u>text</u> (no markdown equivalent) ---
  turndown.addRule("underline", {
    filter: "u",
    replacement(content) {
      return content ? `<u>${content}</u>` : "";
    },
  });

  // --- Tables: GFM-style markdown tables ---
  turndown.addRule("table", {
    filter: "table",
    replacement(_content, node) {
      const table = node as HTMLElement;
      const rows = Array.from(table.querySelectorAll("tr"));
      if (rows.length === 0) return "";

      const matrix: string[][] = [];
      const alignments: string[] = [];

      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll("th, td"));
        const rowData: string[] = [];
        for (const cell of cells) {
          const el = cell as HTMLElement;
          const text = (el.textContent ?? "").trim().replace(/\|/g, "\\|");
          rowData.push(text);

          // Capture alignment from first row's cells
          if (matrix.length === 0) {
            const align = el.style?.textAlign ?? el.getAttribute("align") ?? "";
            if (align === "center") alignments.push(":---:");
            else if (align === "right") alignments.push("---:");
            else alignments.push("---");
          }
        }
        matrix.push(rowData);
      }

      if (matrix.length === 0) return "";

      // Ensure all rows have the same column count
      const colCount = Math.max(...matrix.map((r) => r.length));
      for (const row of matrix) {
        while (row.length < colCount) row.push("");
      }
      while (alignments.length < colCount) alignments.push("---");

      const lines: string[] = [];
      // Header row
      lines.push(`| ${matrix[0].join(" | ")} |`);
      // Separator
      lines.push(`| ${alignments.join(" | ")} |`);
      // Body rows
      for (let i = 1; i < matrix.length; i++) {
        lines.push(`| ${matrix[i].join(" | ")} |`);
      }

      return `\n\n${lines.join("\n")}\n\n`;
    },
  });

  // Prevent turndown from processing inner table elements directly
  turndown.addRule("tableCell", {
    filter: ["thead", "tbody", "tfoot", "tr", "th", "td"],
    replacement() {
      return "";
    },
  });

  return turndown;
}

function formatReference(
  citation: Paper["references"][number],
  index: number
): string {
  const authors = citation.authors
    .map((a) => {
      const parts = a.name.trim().split(/\s+/);
      if (parts.length === 0) return "Unknown";
      const lastName = parts[parts.length - 1];
      const initials = parts
        .slice(0, -1)
        .map((p) => `${p[0]}.`)
        .join(" ");
      return initials ? `${lastName}, ${initials}` : lastName;
    })
    .join(", ");

  const authorStr = authors || "Unknown";
  const yearStr = citation.year ? ` (${citation.year})` : "";
  const titleStr = citation.title ? ` *${citation.title}*.` : "";
  const venueStr = citation.venue ? ` ${citation.venue}.` : "";
  const doiStr = citation.doi ? ` doi:${citation.doi}` : "";

  return `${index + 1}. ${authorStr}${yearStr}.${titleStr}${venueStr}${doiStr}`;
}

export async function exportMarkdown(
  paper: Paper,
  options: ExportOptions
): Promise<ExportResult> {
  const turndown = createTurndownService();

  const parts: string[] = [];

  // Title
  parts.push(`# ${paper.title}\n`);

  // Body content
  const bodyMarkdown = paper.content
    ? turndown.turndown(paper.content).trim()
    : "";

  if (bodyMarkdown) {
    parts.push(bodyMarkdown);
  }

  // References
  if (options.includeReferences && paper.references.length > 0) {
    parts.push("## References\n");
    const refs = paper.references.map((c, i) => formatReference(c, i));
    parts.push(refs.join("\n"));
  }

  const markdown = parts.join("\n\n");

  downloadText(markdown, options.fileName, "text/markdown");

  return { success: true, fileName: options.fileName };
}
