export type ExportFormat = "pdf" | "docx" | "markdown" | "html" | "bibtex" | "latex";

export interface ExportOptions {
  format: ExportFormat;
  includeReferences: boolean;
  includeTableOfContents: boolean;
  fileName: string;
}

export interface ExportResult {
  success: boolean;
  fileName: string;
  error?: string;
}
