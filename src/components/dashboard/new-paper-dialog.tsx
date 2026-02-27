"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  FlaskConical,
  GraduationCap,
  Presentation,
  ScrollText,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { PAPER_TEMPLATES } from "@/lib/constants";
import { useDashboardStore, useEditorStore } from "@/lib/store/editor-store";
import type { CitationStyle, Paper, PaperTemplate } from "@/lib/types";

const templateIcons: Record<PaperTemplate, React.ComponentType<{ className?: string }>> = {
  blank: FileText,
  imrad: FlaskConical,
  "literature-review": BookOpen,
  "systematic-review": Search,
  "grant-proposal": ScrollText,
  "thesis-chapter": GraduationCap,
  "conference-paper": Presentation,
};

const citationStyles: Array<{ value: CitationStyle; label: string; detail: string }> = [
  { value: "apa7", label: "APA 7th", detail: "Psychology, social sciences" },
  { value: "mla9", label: "MLA 9th", detail: "Humanities and literature" },
  { value: "chicago", label: "Chicago", detail: "History and publishing" },
  { value: "ieee", label: "IEEE", detail: "Engineering and CS" },
  { value: "harvard", label: "Harvard", detail: "Author-date citation" },
  { value: "vancouver", label: "Vancouver", detail: "Medical journals" },
];

const STEPS = ["Paper details", "Template", "Citation style"];

interface NewPaperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewPaperDialog({ open, onOpenChange }: NewPaperDialogProps) {
  const router = useRouter();
  const papers = useEditorStore((s) => s.papers);
  const setPapers = useEditorStore((s) => s.setPapers);

  const selectedTemplate = useDashboardStore((s) => s.selectedTemplate);
  const setSelectedTemplate = useDashboardStore((s) => s.setSelectedTemplate);
  const selectedCitationStyle = useDashboardStore((s) => s.selectedCitationStyle);
  const setSelectedCitationStyle = useDashboardStore((s) => s.setSelectedCitationStyle);

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [field, setField] = useState("");
  const [targetJournal, setTargetJournal] = useState("");

  const reset = () => {
    setStep(1);
    setTitle("");
    setField("");
    setTargetJournal("");
    setSelectedTemplate("blank");
    setSelectedCitationStyle("apa7");
  };

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
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
    handleDialogChange(false);
    router.push(`/editor/${newPaper.id}`);
  };

  const canContinue = step !== 1 || title.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden rounded-xl border border-ink-200 bg-white p-0">
        {/* Hidden accessible header */}
        <DialogHeader className="sr-only">
          <DialogTitle>Create new paper</DialogTitle>
          <DialogDescription>
            Set up your paper details, choose a template, and select a citation style.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="px-8 pt-8 pb-6">
          <nav aria-label="Progress steps">
            <ol className="flex items-center justify-center gap-0">
              {STEPS.map((label, idx) => {
                const stepNumber = idx + 1;
                const isActive = stepNumber === step;
                const isCompleted = stepNumber < step;
                const isPending = stepNumber > step;
                const isLast = idx === STEPS.length - 1;

                return (
                  <li key={label} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => isCompleted && setStep(stepNumber)}
                      disabled={!isCompleted}
                      aria-current={isActive ? "step" : undefined}
                      className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-sm"
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                          isActive && "bg-brand-600 text-white",
                          isCompleted && "bg-brand-100 text-brand-600",
                          isPending && "bg-ink-100 text-ink-400"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          stepNumber
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isActive ? "text-ink-900" : "text-ink-400"
                        )}
                      >
                        {label}
                      </span>
                    </button>

                    {!isLast && (
                      <div
                        aria-hidden="true"
                        className={cn(
                          "mx-2 h-px w-12 transition-colors",
                          isCompleted ? "bg-brand-300" : "bg-ink-200"
                        )}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Step content */}
        <div className="max-h-[52vh] overflow-y-auto px-8 pb-2">
          {/* Step 1 — Paper details */}
          {step === 1 && (
            <div>
              <h2 className="mb-6 text-lg font-semibold text-ink-900">Paper details</h2>
              <div className="mb-5">
                <label
                  htmlFor="paper-title"
                  className="mb-1.5 block text-sm font-medium text-ink-700"
                >
                  Paper title
                </label>
                <input
                  id="paper-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Adaptive Governance in Urban Climate Policy"
                  autoFocus
                  className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="mb-5">
                <label
                  htmlFor="paper-field"
                  className="mb-1.5 block text-sm font-medium text-ink-700"
                >
                  Field / discipline
                </label>
                <input
                  id="paper-field"
                  type="text"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder="e.g., Public Policy"
                  className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="mb-5">
                <label
                  htmlFor="target-journal"
                  className="mb-1.5 block text-sm font-medium text-ink-700"
                >
                  Target journal{" "}
                  <span className="font-normal text-ink-400">(optional)</span>
                </label>
                <input
                  id="target-journal"
                  type="text"
                  value={targetJournal}
                  onChange={(e) => setTargetJournal(e.target.value)}
                  placeholder="e.g., Nature Climate Change"
                  className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          )}

          {/* Step 2 — Template selection */}
          {step === 2 && (
            <div>
              <h2 className="mb-6 text-lg font-semibold text-ink-900">Choose a template</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(
                  Object.entries(PAPER_TEMPLATES) as Array<[
                    PaperTemplate,
                    (typeof PAPER_TEMPLATES)[PaperTemplate],
                  ]>
                ).map(([templateKey, template]) => {
                  const Icon = templateIcons[templateKey];
                  const isSelected = selectedTemplate === templateKey;

                  return (
                    <button
                      key={templateKey}
                      type="button"
                      onClick={() => setSelectedTemplate(templateKey)}
                      className={cn(
                        "cursor-pointer rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                        isSelected
                          ? "border-2 border-brand-600 bg-brand-50/50"
                          : "border border-ink-200 hover:border-ink-300"
                      )}
                      aria-pressed={isSelected}
                    >
                      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50">
                        <Icon className="h-4 w-4 text-ink-600" aria-hidden="true" />
                      </div>
                      <p className="text-sm font-medium text-ink-900">{template.label}</p>
                      <p className="mt-1 text-xs text-ink-500">{template.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3 — Citation style */}
          {step === 3 && (
            <div>
              <h2 className="mb-6 text-lg font-semibold text-ink-900">Citation style</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {citationStyles.map((style) => {
                  const isSelected = selectedCitationStyle === style.value;

                  return (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setSelectedCitationStyle(style.value)}
                      className={cn(
                        "cursor-pointer rounded-xl border p-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                        isSelected
                          ? "border-2 border-brand-600 bg-brand-50/50"
                          : "border border-ink-200 hover:border-ink-300"
                      )}
                      aria-pressed={isSelected}
                    >
                      <p className="text-sm font-medium text-ink-900">{style.label}</p>
                      <p className="mt-1 text-xs text-ink-500">{style.detail}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Navigation footer */}
        <div className="mt-6 flex items-center justify-between border-t border-ink-100 px-8 py-5">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((v) => Math.max(1, v - 1))}
              className="flex items-center gap-1 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-sm"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>
          ) : (
            <div aria-hidden="true" />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((v) => Math.min(3, v + 1))}
              disabled={!canContinue}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Continue
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Create paper
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
