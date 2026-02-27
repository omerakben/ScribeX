"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  { value: "apa7", label: "APA 7", detail: "Psychology, social sciences" },
  { value: "mla9", label: "MLA 9", detail: "Humanities and literature" },
  { value: "chicago", label: "Chicago", detail: "History and publishing" },
  { value: "ieee", label: "IEEE", detail: "Engineering and CS" },
  { value: "harvard", label: "Harvard", detail: "Author-date citation" },
  { value: "vancouver", label: "Vancouver", detail: "Medical journals" },
];

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

  const steps = ["Paper details", "Template", "Citation style"];

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

  const templatePreview = useMemo(
    () => PAPER_TEMPLATES[selectedTemplate].sections.slice(0, 4),
    [selectedTemplate]
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden border-ink-200 bg-white p-0">
        <DialogHeader className="border-b border-ink-200 px-7 py-5">
          <DialogTitle className="font-serif text-3xl font-semibold text-ink-950">Create New Paper</DialogTitle>
          <DialogDescription className="text-sm text-ink-600">
            Configure structure and citation defaults before opening your writing workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-ink-200 px-7 py-4">
          <div className="flex items-center gap-3">
            {steps.map((label, idx) => {
              const stepNumber = idx + 1;
              const active = stepNumber === step;
              const completed = stepNumber < step;

              return (
                <div key={label} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => completed && setStep(stepNumber)}
                    disabled={!completed}
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-full text-xs font-semibold transition",
                      active
                        ? "bg-brand-600 text-white"
                        : completed
                          ? "bg-brand-100 text-brand-700"
                          : "bg-ink-100 text-ink-400"
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    {stepNumber}
                  </button>
                  <p className={cn("text-sm font-medium", active ? "text-ink-900" : "text-ink-500")}>{label}</p>
                  {idx !== steps.length - 1 ? <div className="h-px w-8 bg-ink-200" /> : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid max-h-[62vh] grid-cols-1 gap-6 overflow-y-auto px-7 py-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="paper-title" className="mb-2 block text-sm font-semibold text-ink-800">
                    Paper title
                  </label>
                  <Input
                    id="paper-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g., Adaptive Governance in Urban Climate Policy"
                    className="h-11"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="paper-field" className="mb-2 block text-sm font-semibold text-ink-800">
                    Field / discipline
                  </label>
                  <Input
                    id="paper-field"
                    value={field}
                    onChange={(event) => setField(event.target.value)}
                    placeholder="e.g., Public Policy"
                    className="h-11"
                  />
                </div>

                <div>
                  <label htmlFor="target-journal" className="mb-2 block text-sm font-semibold text-ink-800">
                    Target journal <span className="font-normal text-ink-500">(optional)</span>
                  </label>
                  <Input
                    id="target-journal"
                    value={targetJournal}
                    onChange={(event) => setTargetJournal(event.target.value)}
                    placeholder="e.g., Nature Climate Change"
                    className="h-11"
                  />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.entries(PAPER_TEMPLATES) as Array<[
                  PaperTemplate,
                  (typeof PAPER_TEMPLATES)[PaperTemplate],
                ]>).map(([templateKey, template]) => {
                  const Icon = templateIcons[templateKey];
                  const selected = selectedTemplate === templateKey;

                  return (
                    <button
                      key={templateKey}
                      type="button"
                      onClick={() => setSelectedTemplate(templateKey)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition",
                        selected
                          ? "border-brand-400 bg-brand-50"
                          : "border-ink-200 bg-surface-secondary hover:border-ink-300"
                      )}
                    >
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-brand-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-ink-900">{template.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-600">{template.description}</p>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {citationStyles.map((style) => {
                  const selected = selectedCitationStyle === style.value;
                  return (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setSelectedCitationStyle(style.value)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition",
                        selected
                          ? "border-mercury-400 bg-mercury-50"
                          : "border-ink-200 bg-surface-secondary hover:border-ink-300"
                      )}
                    >
                      <p className="text-sm font-semibold text-ink-900">{style.label}</p>
                      <p className="mt-1 text-xs text-ink-600">{style.detail}</p>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <aside className="rounded-2xl border border-ink-200 bg-surface-secondary p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.11em] text-ink-500">Configuration summary</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-ink-500">Title</dt>
                <dd className="font-semibold text-ink-900">{title.trim() || "Untitled Paper"}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Field</dt>
                <dd className="font-semibold text-ink-900">{field.trim() || "Not specified"}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Template</dt>
                <dd className="font-semibold text-ink-900">{PAPER_TEMPLATES[selectedTemplate].label}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Citation style</dt>
                <dd className="font-semibold text-ink-900">{selectedCitationStyle.toUpperCase()}</dd>
              </div>
            </dl>

            <div className="mt-5 rounded-xl border border-ink-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-ink-500">Template sections</p>
              {templatePreview.length > 0 ? (
                <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
                  {templatePreview.map((section) => (
                    <li key={section}>• {section}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-ink-600">Blank template selected. You can define structure manually.</p>
              )}
            </div>
          </aside>
        </div>

        <div className="flex items-center justify-between border-t border-ink-200 px-7 py-4">
          <Button variant="ghost" onClick={() => setStep((value) => Math.max(1, value - 1))} disabled={step === 1}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {step < 3 ? (
            <Button onClick={() => setStep((value) => Math.min(3, value + 1))} disabled={!canContinue}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="mercury" onClick={handleCreate}>
              Create paper
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
