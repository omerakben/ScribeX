import type { Paper, Citation } from "@/lib/types";
import type { ExportOptions, ExportResult } from "@/lib/types/export";
import { downloadText } from "./download";
import { generateCiteKey } from "./cite-utils";

// ─── LaTeX Special Character Escaping ────────────────────────────

function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[&%$#_{}]/g, (c) => `\\${c}`)
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

// ─── Inline Node Conversion ─────────────────────────────────────

function convertNode(node: Node): string {
  // Text node
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeLatex(node.textContent ?? "");
  }

  // Non-element nodes: skip
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  // ── Math nodes (passthrough — no escaping) ──
  if (el.getAttribute("data-type") === "inline-math") {
    const latex = el.getAttribute("data-latex") ?? "";
    return `$${latex}$`;
  }

  if (el.getAttribute("data-type") === "block-math") {
    const latex = el.getAttribute("data-latex") ?? "";
    return `\n\\[\n${latex}\n\\]\n`;
  }

  // ── Mermaid block ──
  if (el.getAttribute("data-type") === "mermaid-block") {
    const content = el.getAttribute("content") ?? "";
    const lines = content.split("\n").map((l) => `% ${l}`);
    return `\n% ── Mermaid Diagram ──\n% Paste the following into a Mermaid renderer:\n${lines.join("\n")}\n`;
  }

  // Recursively convert children
  const children = convertChildren(el);

  // ── Block elements ──
  switch (tag) {
    case "h1":
      return `\n\\section{${children}}\n`;
    case "h2":
      return `\n\\subsection{${children}}\n`;
    case "h3":
      return `\n\\subsubsection{${children}}\n`;
    case "h4":
      return `\n\\paragraph{${children}}\n`;
    case "h5":
    case "h6":
      return `\n\\subparagraph{${children}}\n`;

    case "p":
      return `${children}\n\n`;

    case "blockquote":
      return `\n\\begin{quote}\n${children}\\end{quote}\n`;

    case "pre":
      return convertCodeBlock(el);

    case "ul":
      return `\n\\begin{itemize}\n${children}\\end{itemize}\n`;
    case "ol":
      return `\n\\begin{enumerate}\n${children}\\end{enumerate}\n`;
    case "li":
      return `\\item ${children}\n`;

    case "table":
      return convertTable(el);

    case "hr":
      return `\n\\noindent\\rule{\\textwidth}{0.4pt}\n\n`;

    case "br":
      return "\\\\\n";

    case "img":
      return convertImage(el);

    // ── Inline formatting ──
    case "strong":
    case "b":
      return `\\textbf{${children}}`;
    case "em":
    case "i":
      return `\\textit{${children}}`;
    case "u":
      return `\\uline{${children}}`;
    case "s":
    case "del":
    case "strike":
      return `\\st{${children}}`;
    case "sup":
      return `\\textsuperscript{${children}}`;
    case "sub":
      return `\\textsubscript{${children}}`;
    case "code":
      return `\\texttt{${escapeLatex(el.textContent ?? "")}}`;
    case "a":
      return convertLink(el, children);
    case "mark":
      return children;

    // ── Wrapper elements (pass through) ──
    case "div":
    case "span":
    case "section":
    case "article":
    case "header":
    case "footer":
    case "main":
    case "thead":
    case "tbody":
    case "tfoot":
      return children;

    default:
      return children;
  }
}

function convertChildren(el: Element): string {
  let result = "";
  for (const child of Array.from(el.childNodes)) {
    result += convertNode(child);
  }
  return result;
}

// ─── Code Block Conversion ───────────────────────────────────────

function convertCodeBlock(pre: Element): string {
  const codeEl = pre.querySelector("code");
  const rawText = codeEl?.textContent ?? pre.textContent ?? "";

  // Detect language from class name (e.g. "language-python")
  const langClass = codeEl
    ?.getAttribute("class")
    ?.split(/\s+/)
    .find((c) => c.startsWith("language-"));
  const lang = langClass?.replace("language-", "") ?? "";
  const langOption = lang ? `[language=${lang}]` : "";

  return `\n\\begin{lstlisting}${langOption}\n${rawText}\n\\end{lstlisting}\n`;
}

// ─── Link Conversion ─────────────────────────────────────────────

function convertLink(el: Element, children: string): string {
  const href = el.getAttribute("href") ?? "";
  if (!href) return children;
  return `\\href{${escapeLatex(href)}}{${children}}`;
}

// ─── Image Conversion ────────────────────────────────────────────

function convertImage(el: Element): string {
  const src = el.getAttribute("src") ?? "";
  const alt = el.getAttribute("alt") ?? "Image";
  return `\n% [Image: ${escapeLatex(alt)}] (${escapeLatex(src)})\n`;
}

// ─── Table Conversion ────────────────────────────────────────────

function convertTable(table: Element): string {
  const rows = Array.from(table.querySelectorAll("tr"));
  if (rows.length === 0) return "";

  // Count columns from first row
  const firstRowCells = rows[0].querySelectorAll("th, td");
  const colCount = firstRowCells.length;
  if (colCount === 0) return "";

  const colSpec = Array(colCount).fill("l").join("|");
  const lines: string[] = [];

  lines.push("");
  lines.push("\\begin{table}[htbp]");
  lines.push("\\centering");
  lines.push(`\\begin{tabular}{|${colSpec}|}`);
  lines.push("\\toprule");

  let headerDone = false;

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll("th, td"));
    const isHeader = cells.some((c) => c.tagName.toLowerCase() === "th");

    const cellTexts = cells.map((cell) => {
      // Convert cell content recursively
      return convertChildren(cell).replace(/\n+$/, "").trim();
    });

    lines.push(`${cellTexts.join(" & ")} \\\\`);

    if (isHeader && !headerDone) {
      lines.push("\\midrule");
      headerDone = true;
    }
  }

  lines.push("\\bottomrule");
  lines.push("\\end{tabular}");
  lines.push("\\end{table}");
  lines.push("");

  return lines.join("\n");
}

// ─── Preamble Builder ────────────────────────────────────────────

function buildPreamble(
  paper: Paper,
  options: ExportOptions
): string {
  const escapedTitle = escapeLatex(paper.title);
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lines = [
    "\\documentclass[12pt,a4paper]{article}",
    "",
    "% ── Packages ──",
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage{amsmath,amssymb,amsfonts}",
    "\\usepackage{graphicx}",
    "\\usepackage{hyperref}",
    "\\usepackage{xcolor}",
    "\\usepackage{listings}",
    "\\usepackage{booktabs}",
    "\\usepackage{enumitem}",
    "\\usepackage{geometry}",
    "\\usepackage{fancyhdr}",
    "\\usepackage{textcomp}",
    "\\usepackage{soul}",
    "\\usepackage[normalem]{ulem}",
    "",
    "\\geometry{margin=1in}",
    "",
    "% ── Hyperref Setup ──",
    "\\hypersetup{",
    "  colorlinks=true,",
    "  linkcolor=blue,",
    "  urlcolor=blue,",
    "  citecolor=blue",
    "}",
    "",
    "% ── Code Listing Style ──",
    "\\lstset{",
    "  basicstyle=\\ttfamily\\small,",
    "  breaklines=true,",
    "  frame=single,",
    "  backgroundcolor=\\color{gray!10},",
    "  numbers=none",
    "}",
    "",
    "% ── Header/Footer ──",
    "\\pagestyle{fancy}",
    "\\fancyhf{}",
    `\\rhead{\\textit{${escapedTitle}}}`,
    "\\cfoot{\\thepage}",
    "",
    `\\title{${escapedTitle}}`,
    "\\author{ScribeX Export}",
    `\\date{${date}}`,
    "",
    "\\begin{document}",
    "",
    "\\maketitle",
  ];

  if (options.includeTableOfContents) {
    lines.push("");
    lines.push("\\tableofcontents");
    lines.push("\\newpage");
  }

  lines.push("");

  return lines.join("\n");
}

// ─── References Builder ──────────────────────────────────────────

function buildReferences(references: Citation[]): string {
  if (references.length === 0) return "";

  const usedKeys = new Map<string, number>();
  const lines: string[] = [];

  lines.push("");
  lines.push("\\begin{thebibliography}{99}");
  lines.push("");

  for (const ref of references) {
    const citeKey = generateCiteKey(ref, usedKeys);

    const authorStr =
      ref.authors.length > 0
        ? ref.authors.map((a) => escapeLatex(a.name)).join(", ")
        : "Unknown";

    const yearStr = ref.year ? ` (${ref.year}).` : ".";
    const title = escapeLatex(ref.title);
    const venue = ref.venue ? `\n${escapeLatex(ref.venue)}.` : "";

    let doiStr = "";
    if (ref.doi) {
      doiStr = `\n\\href{https://doi.org/${ref.doi}}{doi:${escapeLatex(ref.doi)}}`;
    }

    lines.push(
      `\\bibitem{${citeKey}}\n${authorStr}${yearStr}\n\\textit{${title}}.${venue}${doiStr}`
    );
    lines.push("");
  }

  lines.push("\\end{thebibliography}");

  return lines.join("\n");
}

// ─── HTML Content Conversion ─────────────────────────────────────

function convertHtmlToLatex(html: string): string {
  if (!html || html.trim() === "") return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  let result = "";
  for (const child of Array.from(doc.body.childNodes)) {
    result += convertNode(child);
  }

  // Clean up excessive blank lines (max 2 newlines in a row)
  return result.replace(/\n{3,}/g, "\n\n").trim();
}

// ─── Main Export Function ────────────────────────────────────────

export async function exportLaTeX(
  paper: Paper,
  options: ExportOptions
): Promise<ExportResult> {
  const fileName = options.fileName;

  const preamble = buildPreamble(paper, options);
  const body = convertHtmlToLatex(paper.content);

  let references = "";
  if (options.includeReferences && paper.references.length > 0) {
    references = buildReferences(paper.references);
  }

  const closing = "\n\n\\end{document}\n";

  const tex = preamble + body + references + closing;

  downloadText(tex, fileName, "application/x-tex");

  return { success: true, fileName };
}
