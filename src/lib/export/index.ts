import type { Paper } from "@/lib/types";
import type { ExportOptions, ExportResult } from "@/lib/types/export";
import { exportPDF } from "./pdf";
import { exportDOCX } from "./docx";
import { exportMarkdown } from "./markdown";
import { exportHTML } from "./html";
import { exportBibTeX } from "./bibtex";
import { exportLaTeX } from "./latex";

export async function exportPaper(
  paper: Paper,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    switch (options.format) {
      case "pdf":
        return await exportPDF(paper, options);
      case "docx":
        return await exportDOCX(paper, options);
      case "markdown":
        return await exportMarkdown(paper, options);
      case "html":
        return await exportHTML(paper, options);
      case "bibtex":
        return await exportBibTeX(paper, options);
      case "latex":
        return await exportLaTeX(paper, options);
      default:
        return {
          success: false,
          fileName: options.fileName,
          error: `Unsupported export format: ${options.format}`,
        };
    }
  } catch (err) {
    return {
      success: false,
      fileName: options.fileName,
      error: err instanceof Error ? err.message : "An unknown error occurred.",
    };
  }
}
