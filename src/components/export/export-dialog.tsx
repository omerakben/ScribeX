"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  FileType,
  Hash,
  Globe,
  BookOpen,
  Code2,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useEditorStore } from "@/lib/store/editor-store";
import { exportPaper } from "@/lib/export";
import type { ExportFormat } from "@/lib/types/export";

interface FormatOption {
  format: ExportFormat;
  label: string;
  extension: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    format: "pdf",
    label: "PDF",
    extension: ".pdf",
    description: "Print-ready document",
    icon: FileText,
  },
  {
    format: "docx",
    label: "Word",
    extension: ".docx",
    description: "Microsoft Word document",
    icon: FileType,
  },
  {
    format: "markdown",
    label: "Markdown",
    extension: ".md",
    description: "Plain text with formatting",
    icon: Hash,
  },
  {
    format: "html",
    label: "HTML",
    extension: ".html",
    description: "Web-ready document",
    icon: Globe,
  },
  {
    format: "bibtex",
    label: "BibTeX",
    extension: ".bib",
    description: "Bibliography references",
    icon: BookOpen,
  },
  {
    format: "latex",
    label: "LaTeX",
    extension: ".tex",
    description: "LaTeX source document",
    icon: Code2,
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getExtension(format: ExportFormat): string {
  const option = FORMAT_OPTIONS.find((o) => o.format === format);
  return option?.extension ?? `.${format}`;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const currentPaper = useEditorStore((s) => s.currentPaper);
  const isExporting = useEditorStore((s) => s.isExporting);
  const setIsExporting = useEditorStore((s) => s.setIsExporting);

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");
  const [includeReferences, setIncludeReferences] = useState(true);
  const [includeTableOfContents, setIncludeTableOfContents] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const hasReferences = (currentPaper?.references?.length ?? 0) > 0;

  const fileName = useMemo(() => {
    const base = slugify(currentPaper?.title || "untitled-paper");
    return `${base}${getExtension(selectedFormat)}`;
  }, [currentPaper?.title, selectedFormat]);

  const handleExport = async () => {
    if (!currentPaper) return;

    setExportError(null);
    setIsExporting(true);

    try {
      const result = await exportPaper(currentPaper, {
        format: selectedFormat,
        includeReferences,
        includeTableOfContents,
        fileName,
      });

      if (result.success) {
        onOpenChange(false);
      } else {
        setExportError(result.error ?? "Export failed.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next) setIsExporting(false);
      onOpenChange(next);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Paper</DialogTitle>
          <DialogDescription>
            Choose a format and configure export options.
          </DialogDescription>
        </DialogHeader>

        {/* Format grid */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FORMAT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedFormat === option.format;

            return (
              <button
                key={option.format}
                type="button"
                onClick={() => {
                  setSelectedFormat(option.format);
                  setExportError(null);
                }}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                  isSelected
                    ? "border-brand-600 bg-brand-50"
                    : "border-ink-200 bg-white hover:bg-ink-50"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md",
                    isSelected
                      ? "bg-brand-100 text-brand-700"
                      : "bg-ink-100 text-ink-500"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-brand-900" : "text-ink-900"
                      )}
                    >
                      {option.label}
                    </span>
                    <span className="text-xs text-ink-400">
                      {option.extension}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Options */}
        <div className="space-y-2 border-t border-ink-100 pt-3">
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wide">
            Options
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeReferences}
              onChange={(e) => setIncludeReferences(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-ink-700">
              Include references
              {!hasReferences && (
                <span className="ml-1 text-ink-400">(none found)</span>
              )}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTableOfContents}
              onChange={(e) => setIncludeTableOfContents(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-ink-700">
              Include table of contents
            </span>
          </label>
        </div>

        {/* Error message */}
        {exportError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {exportError}
          </p>
        )}

        {/* File name preview */}
        <div className="rounded-md bg-ink-50 px-3 py-2">
          <p className="text-xs text-ink-500">
            File name:{" "}
            <span className="font-mono text-ink-700">{fileName}</span>
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || !currentPaper}
            className="bg-brand-600 text-white hover:bg-brand-700"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              "Export"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
