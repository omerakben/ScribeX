"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  FlaskConical,
  BookOpen,
  Search,
  GraduationCap,
  Presentation,
  ScrollText,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { PAPER_TEMPLATES } from "@/lib/constants";
import { useEditorStore, useDashboardStore } from "@/lib/store/editor-store";
import type { Paper, PaperTemplate, CitationStyle } from "@/lib/types";

const TEMPLATE_ICONS: Record<PaperTemplate, React.ReactNode> = {
  blank: <FileText className="h-5 w-5" />,
  imrad: <FlaskConical className="h-5 w-5" />,
  "literature-review": <BookOpen className="h-5 w-5" />,
  "systematic-review": <Search className="h-5 w-5" />,
  "grant-proposal": <ScrollText className="h-5 w-5" />,
  "thesis-chapter": <GraduationCap className="h-5 w-5" />,
  "conference-paper": <Presentation className="h-5 w-5" />,
};

const CITATION_STYLES: { value: CitationStyle; label: string; description: string }[] = [
  { value: "apa7", label: "APA 7th", description: "American Psychological Association" },
  { value: "mla9", label: "MLA 9th", description: "Modern Language Association" },
  { value: "chicago", label: "Chicago", description: "Chicago Manual of Style" },
  { value: "ieee", label: "IEEE", description: "Institute of Electrical and Electronics Engineers" },
  { value: "harvard", label: "Harvard", description: "Harvard Referencing" },
  { value: "vancouver", label: "Vancouver", description: "Vancouver / ICMJE" },
];

interface NewPaperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewPaperDialog({ open, onOpenChange }: NewPaperDialogProps) {
  const router = useRouter();
  const { papers, setPapers } = useEditorStore();
  const {
    selectedTemplate,
    setSelectedTemplate,
    selectedCitationStyle,
    setSelectedCitationStyle,
  } = useDashboardStore();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [field, setField] = useState("");
  const [targetJournal, setTargetJournal] = useState("");

  const resetState = () => {
    setStep(1);
    setTitle("");
    setField("");
    setTargetJournal("");
    setSelectedTemplate("blank");
    setSelectedCitationStyle("apa7");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  };

  const handleCreate = () => {
    const now = new Date().toISOString();
    const newPaper: Paper = {
      id: crypto.randomUUID(),
      title: title.trim() || "Untitled Paper",
      template: selectedTemplate,
      status: "draft",
      citationStyle: selectedCitationStyle,
      content: "",
      wordCount: 0,
      field: field.trim() || undefined,
      targetJournal: targetJournal.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    setPapers([...papers, newPaper]);
    handleOpenChange(false);
    router.push(`/editor/${newPaper.id}`);
  };

  const canProceedStep1 = title.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        {/* Header */}
        <DialogHeader className="border-b border-ink-200 px-6 py-4 dark:border-ink-700">
          <DialogTitle>Create New Paper</DialogTitle>
          <DialogDescription>
            {step === 1 && "Enter your paper details"}
            {step === 2 && "Choose a template structure"}
            {step === 3 && "Select your citation style"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 border-b border-ink-100 px-6 py-3 dark:border-ink-800">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => s < step && setStep(s)}
                disabled={s > step}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  s === step
                    ? "bg-brand-600 text-white"
                    : s < step
                      ? "bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-900 dark:text-brand-300"
                      : "bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500"
                )}
                aria-label={`Step ${s}`}
                aria-current={s === step ? "step" : undefined}
              >
                {s}
              </button>
              {s < 3 && (
                <div
                  className={cn(
                    "h-px w-8",
                    s < step
                      ? "bg-brand-400"
                      : "bg-ink-200 dark:bg-ink-700"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="px-6 py-5">
          {/* Step 1: Paper details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="paper-title"
                  className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300"
                >
                  Paper Title
                </label>
                <Input
                  id="paper-title"
                  placeholder="e.g., Effects of Climate Change on Coral Reef Biodiversity"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label
                  htmlFor="paper-field"
                  className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300"
                >
                  Field / Discipline
                </label>
                <Input
                  id="paper-field"
                  placeholder="e.g., Marine Biology, Computer Science"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="target-journal"
                  className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300"
                >
                  Target Journal{" "}
                  <span className="text-ink-400">(optional)</span>
                </label>
                <Input
                  id="target-journal"
                  placeholder="e.g., Nature, Science, JAMA"
                  value={targetJournal}
                  onChange={(e) => setTargetJournal(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Template selection */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-3">
              {(
                Object.entries(PAPER_TEMPLATES) as [
                  PaperTemplate,
                  (typeof PAPER_TEMPLATES)[PaperTemplate],
                ][]
              ).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => setSelectedTemplate(key)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all",
                    selectedTemplate === key
                      ? "border-brand-500 bg-brand-50 shadow-sm dark:border-brand-400 dark:bg-brand-950"
                      : "border-ink-200 bg-surface hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:hover:border-ink-600 dark:hover:bg-ink-800"
                  )}
                  aria-pressed={selectedTemplate === key}
                >
                  <div
                    className={cn(
                      "mt-0.5 rounded-md p-1.5",
                      selectedTemplate === key
                        ? "bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-400"
                        : "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400"
                    )}
                  >
                    {TEMPLATE_ICONS[key]}
                  </div>
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "text-sm font-semibold",
                        selectedTemplate === key
                          ? "text-brand-700 dark:text-brand-300"
                          : "text-ink-800 dark:text-ink-200"
                      )}
                    >
                      {template.label}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                      {template.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Citation style */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-3">
              {CITATION_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setSelectedCitationStyle(style.value)}
                  className={cn(
                    "rounded-lg border-2 px-4 py-3 text-left transition-all",
                    selectedCitationStyle === style.value
                      ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-950"
                      : "border-ink-200 bg-surface hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:hover:border-ink-600 dark:hover:bg-ink-800"
                  )}
                  aria-pressed={selectedCitationStyle === style.value}
                >
                  <div
                    className={cn(
                      "text-sm font-semibold",
                      selectedCitationStyle === style.value
                        ? "text-brand-700 dark:text-brand-300"
                        : "text-ink-800 dark:text-ink-200"
                    )}
                  >
                    {style.label}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                    {style.description}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-ink-200 px-6 py-4 dark:border-ink-700">
          <div>
            {step > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(step - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div>
            {step < 3 ? (
              <Button
                size="sm"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !canProceedStep1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleCreate}>
                Create Paper
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
