import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ExternalHyperlink,
  Header,
  Footer,
  PageNumber,
  TableOfContents,
  PageBreak,
  UnderlineType,
  ShadingType,
  LevelFormat,
  convertInchesToTwip,
} from "docx";
import type { Paper } from "@/lib/types";
import type { ExportOptions, ExportResult } from "@/lib/types/export";
import { downloadBlob } from "./download";

// ─── Formatting Context ─────────────────────────────────────────

interface FormatState {
  bold: boolean;
  italics: boolean;
  underline: boolean;
  strike: boolean;
  superScript: boolean;
  subScript: boolean;
  font?: string;
  color?: string;
  highlight?: string;
  link?: string;
}

const DEFAULT_FORMAT: FormatState = {
  bold: false,
  italics: false,
  underline: false,
  strike: false,
  superScript: false,
  subScript: false,
};

type InlineChild = TextRun | ExternalHyperlink;
type DocxChild = Paragraph | Table;

// ─── Numbering Definitions ──────────────────────────────────────

const BULLET_REF = "scribex-bullets";
const ORDERED_REF = "scribex-ordered";

function createNumberingConfig() {
  return {
    config: [
      {
        reference: BULLET_REF,
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } } },
          { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(1.0), hanging: convertInchesToTwip(0.25) } } } },
          { level: 2, format: LevelFormat.BULLET, text: "\u25AA", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(1.5), hanging: convertInchesToTwip(0.25) } } } },
        ],
      },
      {
        reference: ORDERED_REF,
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } } },
          { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(1.0), hanging: convertInchesToTwip(0.25) } } } },
          { level: 2, format: LevelFormat.LOWER_ROMAN, text: "%3.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(1.5), hanging: convertInchesToTwip(0.25) } } } },
        ],
      },
    ],
  };
}

// ─── Inline Node Processing ─────────────────────────────────────

function makeTextRun(text: string, fmt: FormatState): TextRun {
  return new TextRun({
    text,
    bold: fmt.bold || undefined,
    italics: fmt.italics || undefined,
    underline: fmt.underline ? { type: UnderlineType.SINGLE } : undefined,
    strike: fmt.strike || undefined,
    superScript: fmt.superScript || undefined,
    subScript: fmt.subScript || undefined,
    font: fmt.font,
    color: fmt.color,
    shading: fmt.highlight
      ? { type: ShadingType.SOLID, color: fmt.highlight, fill: fmt.highlight }
      : undefined,
  });
}

/** Recursively collect inline children from a DOM node. */
function collectInlineChildren(
  node: Node,
  fmt: FormatState
): InlineChild[] {
  const results: InlineChild[] = [];

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    if (text.length > 0) {
      if (fmt.link) {
        results.push(
          new ExternalHyperlink({
            link: fmt.link,
            children: [
              makeTextRun(text, {
                ...fmt,
                color: "0563C1",
                underline: true,
                link: undefined,
              }),
            ],
          })
        );
      } else {
        results.push(makeTextRun(text, fmt));
      }
    }
    return results;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return results;

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  // Math nodes (TipTap mathematics extension)
  const dataType = el.getAttribute("data-type");
  if (dataType === "inline-math" || dataType === "block-math") {
    const latex = el.getAttribute("data-latex") ?? el.textContent ?? "";
    results.push(
      new TextRun({
        text: latex,
        font: "Cambria Math",
        italics: true,
        bold: fmt.bold || undefined,
      })
    );
    return results;
  }

  // Mermaid diagram placeholder
  if (dataType === "mermaid-block") {
    results.push(
      makeTextRun(
        "[Mermaid Diagram \u2014 view in ScribeX or HTML export]",
        { ...fmt, italics: true, color: "888888" }
      )
    );
    return results;
  }

  // Build new formatting state based on element tag
  const next = { ...fmt };

  switch (tag) {
    case "strong":
    case "b":
      next.bold = true;
      break;
    case "em":
    case "i":
      next.italics = true;
      break;
    case "u":
      next.underline = true;
      break;
    case "s":
    case "del":
    case "strike":
      next.strike = true;
      break;
    case "sup":
      next.superScript = true;
      break;
    case "sub":
      next.subScript = true;
      break;
    case "code":
      next.font = "Courier New";
      break;
    case "a":
      next.link = el.getAttribute("href") ?? undefined;
      break;
    case "mark": {
      const bgColor = el.getAttribute("data-color") ?? el.style.backgroundColor;
      next.highlight = bgColor || "FFFF00";
      break;
    }
    case "br":
      results.push(new TextRun({ break: 1 }));
      return results;
    default:
      break;
  }

  for (const child of Array.from(el.childNodes)) {
    results.push(...collectInlineChildren(child, next));
  }

  return results;
}

// ─── Block Node Processing ──────────────────────────────────────

interface ListContext {
  type: "ul" | "ol";
  level: number;
}

/** Convert a DOM tree to docx block elements. */
function convertNodes(
  nodes: NodeListOf<ChildNode> | ChildNode[],
  listCtx?: ListContext
): DocxChild[] {
  const results: DocxChild[] = [];

  for (const node of Array.from(nodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").trim();
      if (text) {
        results.push(
          new Paragraph({
            children: [makeTextRun(text, DEFAULT_FORMAT)],
          })
        );
      }
      continue;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) continue;

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    // Check for math/mermaid at block level
    const dataType = el.getAttribute("data-type");
    if (dataType === "block-math") {
      const latex = el.getAttribute("data-latex") ?? el.textContent ?? "";
      results.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [
            new TextRun({
              text: latex,
              font: "Cambria Math",
              italics: true,
              size: 24,
            }),
          ],
        })
      );
      continue;
    }

    if (dataType === "inline-math") {
      const latex = el.getAttribute("data-latex") ?? el.textContent ?? "";
      results.push(
        new Paragraph({
          children: [
            new TextRun({
              text: latex,
              font: "Cambria Math",
              italics: true,
            }),
          ],
        })
      );
      continue;
    }

    if (dataType === "mermaid-block") {
      results.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
          children: [
            makeTextRun(
              "[Mermaid Diagram \u2014 view in ScribeX or HTML export]",
              { ...DEFAULT_FORMAT, italics: true, color: "888888" }
            ),
          ],
        })
      );
      continue;
    }

    switch (tag) {
      // ── Headings ──
      case "h1":
        results.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: collectInlineChildren(el, DEFAULT_FORMAT),
          })
        );
        break;

      case "h2":
        results.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: collectInlineChildren(el, DEFAULT_FORMAT),
          })
        );
        break;

      case "h3":
        results.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: collectInlineChildren(el, DEFAULT_FORMAT),
          })
        );
        break;

      case "h4":
      case "h5":
      case "h6":
        results.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_4,
            children: collectInlineChildren(el, DEFAULT_FORMAT),
          })
        );
        break;

      // ── Paragraphs ──
      case "p": {
        const alignment = parseAlignment(el);
        const children = collectInlineChildren(el, DEFAULT_FORMAT);
        results.push(
          new Paragraph({
            ...(alignment ? { alignment } : {}),
            spacing: { after: 120 },
            children: children.length > 0 ? children : [new TextRun({ text: "" })],
          })
        );
        break;
      }

      // ── Lists ──
      case "ul":
      case "ol": {
        const level = listCtx ? listCtx.level + 1 : 0;
        for (const li of Array.from(el.children)) {
          if (li.tagName.toLowerCase() === "li") {
            results.push(
              ...convertListItem(li as HTMLElement, {
                type: tag as "ul" | "ol",
                level,
              })
            );
          }
        }
        break;
      }

      // ── Blockquote ──
      case "blockquote":
        results.push(...convertBlockquote(el));
        break;

      // ── Code blocks ──
      case "pre":
        results.push(...convertCodeBlock(el));
        break;

      // ── Tables ──
      case "table":
        results.push(convertTable(el));
        break;

      // ── Horizontal rule ──
      case "hr":
        results.push(
          new Paragraph({
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" },
            },
            spacing: { before: 200, after: 200 },
            children: [],
          })
        );
        break;

      // ── Image (placeholder) ──
      case "img": {
        const alt = el.getAttribute("alt") ?? "Image";
        results.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 120 },
            children: [
              makeTextRun(`[Image: ${alt}]`, {
                ...DEFAULT_FORMAT,
                italics: true,
                color: "888888",
              }),
            ],
          })
        );
        break;
      }

      // ── Divs and other containers — recurse into children ──
      case "div":
      case "section":
      case "article":
      case "span":
      case "figure":
      case "figcaption":
        results.push(...convertNodes(el.childNodes));
        break;

      // ── Default: try to extract inline content as a paragraph ──
      default: {
        const inlines = collectInlineChildren(el, DEFAULT_FORMAT);
        if (inlines.length > 0) {
          results.push(new Paragraph({ children: inlines }));
        }
        break;
      }
    }
  }

  return results;
}

// ─── Specialized Converters ─────────────────────────────────────

function convertListItem(
  li: HTMLElement,
  ctx: ListContext
): DocxChild[] {
  const results: DocxChild[] = [];
  const inlineChildren: InlineChild[] = [];
  const nestedBlocks: DocxChild[] = [];

  // Separate inline content from nested lists/blocks
  for (const child of Array.from(li.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const childTag = (child as HTMLElement).tagName.toLowerCase();
      if (childTag === "ul" || childTag === "ol") {
        nestedBlocks.push(
          ...convertNodes([child], ctx)
        );
        continue;
      }
      if (childTag === "p") {
        inlineChildren.push(
          ...collectInlineChildren(child, DEFAULT_FORMAT)
        );
        continue;
      }
    }
    inlineChildren.push(...collectInlineChildren(child, DEFAULT_FORMAT));
  }

  if (inlineChildren.length > 0 || nestedBlocks.length === 0) {
    results.push(
      new Paragraph({
        numbering:
          ctx.type === "ol"
            ? { reference: ORDERED_REF, level: ctx.level }
            : undefined,
        bullet: ctx.type === "ul" ? { level: ctx.level } : undefined,
        children:
          inlineChildren.length > 0
            ? inlineChildren
            : [new TextRun({ text: "" })],
      })
    );
  }

  results.push(...nestedBlocks);
  return results;
}

function convertBlockquote(el: HTMLElement): Paragraph[] {
  const blockquoteFmt: FormatState = {
    ...DEFAULT_FORMAT,
    italics: true,
    color: "555555",
  };

  const blockquoteStyle = {
    indent: { left: convertInchesToTwip(0.5) },
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: "CCCCCC", space: 8 } as const,
    },
  };

  // Process each direct child element of the blockquote individually
  const paragraphs: Paragraph[] = [];

  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = (child.textContent ?? "").trim();
      if (text) {
        paragraphs.push(
          new Paragraph({
            ...blockquoteStyle,
            spacing: { before: 60, after: 60 },
            children: [makeTextRun(text, blockquoteFmt)],
          })
        );
      }
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const childEl = child as HTMLElement;
    const inlines = collectInlineChildren(childEl, blockquoteFmt);

    if (inlines.length > 0) {
      paragraphs.push(
        new Paragraph({
          ...blockquoteStyle,
          spacing: { before: 60, after: 60 },
          children: inlines,
        })
      );
    }
  }

  // If no children found, create one paragraph from the entire element
  if (paragraphs.length === 0) {
    paragraphs.push(
      new Paragraph({
        ...blockquoteStyle,
        spacing: { before: 120, after: 120 },
        children: collectInlineChildren(el, blockquoteFmt),
      })
    );
  }

  return paragraphs;
}

function convertCodeBlock(preEl: HTMLElement): Paragraph[] {
  const codeEl = preEl.querySelector("code");
  const text = codeEl?.textContent ?? preEl.textContent ?? "";
  const lines = text.split("\n");

  return lines.map(
    (line, i) =>
      new Paragraph({
        shading: { type: ShadingType.SOLID, color: "F5F5F5", fill: "F5F5F5" },
        spacing: { before: i === 0 ? 120 : 0, after: i === lines.length - 1 ? 120 : 0 },
        indent: { left: convertInchesToTwip(0.25), right: convertInchesToTwip(0.25) },
        children: [
          new TextRun({
            text: line || " ",
            font: "Courier New",
            size: 20,
          }),
        ],
      })
  );
}

function convertTable(tableEl: HTMLElement): Table {
  const rows: TableRow[] = [];
  const trs = tableEl.querySelectorAll("tr");

  for (const tr of Array.from(trs)) {
    const cells: TableCell[] = [];
    const tds = tr.querySelectorAll("td, th");
    const isHeader = tr.querySelector("th") !== null;

    for (const td of Array.from(tds)) {
      const inlines = collectInlineChildren(td, {
        ...DEFAULT_FORMAT,
        bold: isHeader,
      });
      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: inlines.length > 0 ? inlines : [new TextRun({ text: "" })],
            }),
          ],
          shading: isHeader
            ? { type: ShadingType.SOLID, color: "F0F0F0", fill: "F0F0F0" }
            : undefined,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          },
        })
      );
    }

    if (cells.length > 0) {
      rows.push(new TableRow({ children: cells }));
    }
  }

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// ─── Helper Utilities ───────────────────────────────────────────

function parseAlignment(el: HTMLElement): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
  const align = el.style.textAlign || el.getAttribute("align");
  switch (align) {
    case "center":
      return AlignmentType.CENTER;
    case "right":
      return AlignmentType.RIGHT;
    case "justify":
      return AlignmentType.JUSTIFIED;
    default:
      return undefined;
  }
}

function formatAuthorName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  const last = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map((p) => (p[0] ? p[0].toUpperCase() + "." : ""))
    .join(" ");
  return `${last}, ${initials}`;
}

function buildReferenceParagraphs(references: Paper["references"]): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 480, after: 200 },
      children: [new TextRun({ text: "References" })],
    }),
  ];

  references.forEach((ref, idx) => {
    const num = `[${idx + 1}] `;
    const authors = ref.authors.map((a) => formatAuthorName(a.name)).join(", ");
    const year = ref.year ? ` (${ref.year}). ` : ". ";
    const title = ref.title;
    const venue = ref.venue ? `. ${ref.venue}` : "";
    const doi = ref.doi ? `. doi:${ref.doi}` : "";

    paragraphs.push(
      new Paragraph({
        spacing: { after: 80 },
        indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.5) },
        children: [
          new TextRun({ text: num, bold: true }),
          new TextRun({ text: authors }),
          new TextRun({ text: year }),
          new TextRun({ text: title, italics: true }),
          new TextRun({ text: venue }),
          new TextRun({ text: doi }),
        ],
      })
    );
  });

  return paragraphs;
}

// ─── Main Export Function ───────────────────────────────────────

export async function exportDOCX(
  paper: Paper,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    // Parse HTML content
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(
      paper.content || "<p></p>",
      "text/html"
    );

    // Convert DOM to docx paragraphs
    const contentParagraphs = convertNodes(htmlDoc.body.childNodes);

    // Build references section
    const referencesParagraphs =
      options.includeReferences && paper.references.length > 0
        ? buildReferenceParagraphs(paper.references)
        : [];

    // Build TOC + page break
    const tocChildren: (Paragraph | TableOfContents)[] = options.includeTableOfContents
      ? [
          new TableOfContents("Table of Contents", {
            hyperlink: true,
            headingStyleRange: "1-3",
          }),
          new Paragraph({ children: [new PageBreak()] }),
        ]
      : [];

    // Assemble document
    const doc = new Document({
      creator: "ScribeX",
      title: paper.title,
      description: `Exported from ScribeX on ${new Date().toISOString()}`,
      numbering: createNumberingConfig(),
      styles: {
        default: {
          document: {
            run: { font: "Newsreader", size: 24 },
          },
          heading1: {
            run: { font: "Manrope", size: 36, bold: true, color: "1a1a2e" },
            paragraph: { spacing: { before: 480, after: 120 } },
          },
          heading2: {
            run: { font: "Manrope", size: 30, bold: true, color: "1a1a2e" },
            paragraph: { spacing: { before: 360, after: 100 } },
          },
          heading3: {
            run: { font: "Manrope", size: 26, bold: true, color: "1a1a2e" },
            paragraph: { spacing: { before: 240, after: 80 } },
          },
          heading4: {
            run: { font: "Manrope", size: 24, bold: true, color: "1a1a2e" },
            paragraph: { spacing: { before: 200, after: 60 } },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 }, // A4
              margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 1in
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: paper.title,
                      italics: true,
                      size: 18,
                      color: "888888",
                      font: "Manrope",
                    }),
                  ],
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      size: 18,
                      color: "888888",
                    }),
                  ],
                }),
              ],
            }),
          },
          children: [
            // Title
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
              children: [
                new TextRun({
                  text: paper.title,
                  bold: true,
                  font: "Manrope",
                  size: 48,
                  color: "1a1a2e",
                }),
              ],
            }),
            // TOC (optional)
            ...tocChildren,
            // Content
            ...contentParagraphs,
            // References (optional)
            ...referencesParagraphs,
          ],
        },
      ],
    });

    // Pack to blob and download
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, options.fileName);

    return { success: true, fileName: options.fileName };
  } catch (err) {
    return {
      success: false,
      fileName: options.fileName,
      error:
        err instanceof Error
          ? err.message
          : "An unknown error occurred during DOCX export.",
    };
  }
}
