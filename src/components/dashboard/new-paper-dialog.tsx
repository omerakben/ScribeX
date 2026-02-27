"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
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
import {
  CHICAGO_VARIANT_CATALOG,
  CITATION_STYLE_CATALOG,
  CITATION_STYLE_ORDER,
  DEFAULT_CITATION_STYLE_SELECTION,
  PAPER_TEMPLATES,
  normalizeCitationStyleSelection,
} from "@/lib/constants";
import { useDashboardStore, useEditorStore } from "@/lib/store/editor-store";
import type {
  ChicagoCitationVariant,
  CitationStyleId,
  Paper,
  PaperTemplate,
} from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const templateIcons: Record<PaperTemplate, React.ComponentType<{ className?: string }>> = {
  blank: FileText,
  imrad: FlaskConical,
  "literature-review": BookOpen,
  "systematic-review": Search,
  "grant-proposal": ScrollText,
  "thesis-chapter": GraduationCap,
  "conference-paper": Presentation,
};

const STEPS = [
  { label: "Paper details", shortLabel: "Details" },
  { label: "Template", shortLabel: "Template" },
  { label: "Citation style", shortLabel: "Citations" },
] as const;

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
  const [titleError, setTitleError] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const selectedCitationStyleId = selectedCitationStyle.id;
  const selectedChicagoVariant = selectedCitationStyle.chicagoVariant ?? "notes-bibliography";

  const templateOptions = useMemo(
    () =>
      Object.entries(PAPER_TEMPLATES) as Array<
        [PaperTemplate, (typeof PAPER_TEMPLATES)[PaperTemplate]]
      >,
    []
  );

  const citationStyleOptions = useMemo(() => {
    const ordered = [...CITATION_STYLE_ORDER];
    if (!ordered.includes(selectedCitationStyleId)) {
      ordered.unshift(selectedCitationStyleId);
    }

    return Array.from(new Set(ordered)).map((styleId) => CITATION_STYLE_CATALOG[styleId]);
  }, [selectedCitationStyleId]);

  const reset = () => {
    setStep(1);
    setTitle("");
    setField("");
    setTargetJournal("");
    setTitleError(null);
    setSelectedTemplate("blank");
    setSelectedCitationStyle({ ...DEFAULT_CITATION_STYLE_SELECTION });
  };

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      if (step === 1) {
        titleInputRef.current?.focus();
        return;
      }

      headingRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open, step]);

  const validateStepOne = () => {
    if (title.trim().length > 0) {
      setTitleError(null);
      return true;
    }

    setTitleError("A paper title is required before choosing a template.");
    titleInputRef.current?.focus();
    return false;
  };

  const handleContinue = () => {
    if (step === 1 && !validateStepOne()) return;
    setStep((value) => Math.min(STEPS.length, value + 1));
  };

  const handleCitationStyleSelect = (styleId: CitationStyleId) => {
    if (styleId === "chicago-17") {
      setSelectedCitationStyle({
        id: "chicago-17",
        chicagoVariant: selectedChicagoVariant,
      });
      return;
    }

    setSelectedCitationStyle({ id: styleId });
  };

  const handleChicagoVariantSelect = (variant: ChicagoCitationVariant) => {
    setSelectedCitationStyle({ id: "chicago-17", chicagoVariant: variant });
  };

  const handleCreate = () => {
    const now = new Date().toISOString();
    const newPaper: Paper = {
      id: crypto.randomUUID(),
      title: title.trim() || "Untitled Paper",
      template: selectedTemplate,
      status: "draft",
      citationStyle: normalizeCitationStyleSelection(selectedCitationStyle),
      references: [],
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

  const stepStatusAnnouncement = `Step ${step} of ${STEPS.length}: ${
    STEPS[step - 1]?.label ?? "Paper details"
  }`;

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden rounded-xl border border-ink-200 bg-surface-elevated p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Create new paper</DialogTitle>
          <DialogDescription>
            Set up your paper details, choose a template, and select a citation style.
          </DialogDescription>
        </DialogHeader>

        <p aria-live="polite" aria-atomic="true" className="sr-only">
          {stepStatusAnnouncement}
        </p>

        <div className="border-b border-ink-100 px-4 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6">
          <nav aria-label="Progress steps">
            <ol className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:justify-center sm:gap-0">
              {STEPS.map((stepMeta, idx) => {
                const stepNumber = idx + 1;
                const isActive = stepNumber === step;
                const isCompleted = stepNumber < step;
                const isPending = stepNumber > step;
                const isLast = idx === STEPS.length - 1;

                return (
                  <li
                    key={stepMeta.label}
                    className="flex items-center sm:w-full sm:max-w-[220px]"
                  >
                    <button
                      type="button"
                      onClick={() => isCompleted && setStep(stepNumber)}
                      disabled={!isCompleted}
                      aria-current={isActive ? "step" : undefined}
                      className={cn(
                        "flex w-full flex-col items-center gap-1.5 rounded-lg px-1 py-1.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:w-auto sm:flex-row sm:gap-2 sm:text-left",
                        isCompleted && "hover:bg-ink-50",
                        !isCompleted && "cursor-default"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors sm:h-8 sm:w-8",
                          isActive && "bg-brand-600 text-white shadow-sm shadow-brand-600/25",
                          isCompleted && "bg-brand-100 text-brand-700",
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
                          "text-[11px] font-medium leading-tight sm:text-sm",
                          isActive ? "text-ink-900" : "text-ink-500"
                        )}
                      >
                        <span className="sm:hidden">{stepMeta.shortLabel}</span>
                        <span className="hidden sm:inline">{stepMeta.label}</span>
                      </span>
                    </button>

                    {!isLast && (
                      <div
                        aria-hidden="true"
                        className={cn(
                          "mx-2 hidden h-px w-full transition-colors sm:block",
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

        <div className="max-h-[52vh] overflow-y-auto px-4 pb-2 sm:px-8">
          {step === 1 && (
            <div>
              <h2 className="mb-6 text-lg font-semibold text-ink-900">Paper details</h2>
              <div className="mb-5">
                <label
                  htmlFor="paper-title"
                  className="mb-1.5 block text-sm font-medium text-ink-700"
                >
                  Paper title <span className="text-brand-700">*</span>
                </label>
                <input
                  ref={titleInputRef}
                  id="paper-title"
                  name="paperTitle"
                  autoComplete="off"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (titleError && e.target.value.trim().length > 0) {
                      setTitleError(null);
                    }
                  }}
                  onBlur={() => {
                    if (step === 1 && title.trim().length === 0) {
                      setTitleError("A paper title is required before choosing a template.");
                    }
                  }}
                  placeholder="e.g., Adaptive Governance in Urban Climate Policy"
                  aria-required="true"
                  aria-invalid={Boolean(titleError)}
                  aria-describedby={
                    titleError ? "paper-title-help paper-title-error" : "paper-title-help"
                  }
                  className={cn(
                    "w-full rounded-lg border px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:outline-none focus:ring-2",
                    titleError
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-ink-200 focus:border-brand-500 focus:ring-brand-500/20"
                  )}
                />
                <p id="paper-title-help" className="mt-1.5 text-xs text-ink-500">
                  Required before moving to template selection.
                </p>
                <p
                  id="paper-title-error"
                  role={titleError ? "alert" : undefined}
                  className={cn("mt-1 text-xs text-red-600", titleError ? "block" : "sr-only")}
                >
                  {titleError ?? ""}
                </p>
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
                  name="paperField"
                  autoComplete="organization-title"
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
                  Target journal <span className="font-normal text-ink-400">(optional)</span>
                </label>
                <input
                  id="target-journal"
                  name="targetJournal"
                  autoComplete="organization"
                  type="text"
                  value={targetJournal}
                  onChange={(e) => setTargetJournal(e.target.value)}
                  placeholder="e.g., Nature Climate Change"
                  className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <section aria-labelledby="template-step-heading">
              <h2
                id="template-step-heading"
                ref={headingRef}
                tabIndex={-1}
                className="mb-2 text-lg font-semibold text-ink-900 focus:outline-none"
              >
                Choose a template
              </h2>
              <p className="mb-5 text-sm text-ink-600">
                Start with a structure tailored to your writing goal. You can edit section
                names later.
              </p>
              <fieldset>
                <legend className="sr-only">Select one paper template</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {templateOptions.map(([templateKey, template]) => {
                    const sectionCount = template.sections.length;
                    const sectionLabel =
                      sectionCount === 0
                        ? "No predefined sections"
                        : `${sectionCount} starter ${sectionCount === 1 ? "section" : "sections"}`;
                    const isSelected = selectedTemplate === templateKey;
                    const Icon = templateIcons[templateKey];

                    return (
                      <label
                        key={templateKey}
                        className={cn(
                          "group relative flex cursor-pointer flex-col rounded-2xl border bg-surface-elevated p-4 transition-all focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2",
                          isSelected
                            ? "border-brand-500 shadow-sm shadow-brand-500/10"
                            : "border-ink-200 hover:border-ink-300 hover:bg-ink-50/40"
                        )}
                      >
                        <input
                          type="radio"
                          name="paper-template"
                          value={templateKey}
                          checked={isSelected}
                          onChange={() => setSelectedTemplate(templateKey)}
                          className="sr-only"
                        />
                        <div className="absolute top-4 right-4">
                          <span
                            className={cn(
                              "inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                              isSelected
                                ? "border-brand-600 bg-brand-600 text-white"
                                : "border-ink-300 bg-white text-transparent"
                            )}
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                        </div>
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50">
                          <Icon className="h-4 w-4 text-ink-600" aria-hidden="true" />
                        </div>
                        <p className="pr-7 text-sm font-semibold text-ink-900">{template.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-ink-600">
                          {template.description}
                        </p>
                        <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 text-xs text-ink-500">
                          <span>{sectionLabel}</span>
                          <span className={cn("font-medium", isSelected ? "text-brand-700" : "text-ink-500")}>
                            {isSelected ? "Selected" : "Select"}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </section>
          )}

          {step === 3 && (
            <section aria-labelledby="citation-step-heading">
              <h2
                id="citation-step-heading"
                ref={headingRef}
                tabIndex={-1}
                className="mb-2 text-lg font-semibold text-ink-900 focus:outline-none"
              >
                Citation style
              </h2>
              <p className="mb-5 text-sm text-ink-600">
                Select one citation system for references and in-text formatting.
              </p>
              <fieldset>
                <legend className="sr-only">Select one citation style</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {citationStyleOptions.map((style) => {
                    const isSelected = selectedCitationStyleId === style.id;

                    return (
                      <label
                        key={style.id}
                        className={cn(
                          "group relative flex cursor-pointer flex-col rounded-2xl border bg-surface-elevated p-4 transition-all focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2",
                          isSelected
                            ? "border-brand-500 shadow-sm shadow-brand-500/10"
                            : "border-ink-200 hover:border-ink-300 hover:bg-ink-50/40"
                        )}
                      >
                        <input
                          type="radio"
                          name="citation-style"
                          value={style.id}
                          checked={isSelected}
                          onChange={() => handleCitationStyleSelect(style.id)}
                          className="sr-only"
                        />
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink-900">{style.label}</p>
                            <p className="mt-1 text-xs leading-relaxed text-ink-600">
                              {style.description}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                              isSelected
                                ? "border-brand-600 bg-brand-600 text-white"
                                : "border-ink-300 bg-white text-transparent"
                            )}
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
                          <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-medium text-ink-700">
                            {style.family}
                          </span>
                          <span className="text-xs text-ink-500">{style.inTextExample}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {selectedCitationStyleId === "chicago-17" ? (
                <fieldset className="mt-5 rounded-2xl border border-brand-200 bg-brand-50/40 p-4 sm:p-5">
                  <legend className="px-1 text-sm font-semibold text-ink-900">
                    Chicago subtype
                  </legend>
                  <p className="mt-1 text-xs text-ink-600">
                    Pick the Chicago variant your publication expects.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {CHICAGO_VARIANT_CATALOG.map((option) => {
                      const isSelected = selectedChicagoVariant === option.id;

                      return (
                        <label
                          key={option.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-2 rounded-lg border bg-surface-elevated px-3 py-2.5 transition-colors focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2",
                            isSelected ? "border-brand-500" : "border-ink-200 hover:border-ink-300"
                          )}
                        >
                          <input
                            type="radio"
                            name="chicago-subtype"
                            value={option.id}
                            checked={isSelected}
                            onChange={() => handleChicagoVariantSelect(option.id)}
                            className="sr-only"
                          />
                          <CircleCheckBig
                            className={cn(
                              "mt-0.5 h-4 w-4 shrink-0",
                              isSelected ? "text-brand-600" : "text-ink-300"
                            )}
                            aria-hidden="true"
                          />
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold text-ink-800">
                              {option.label}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-ink-600">
                              {option.description}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}
            </section>
          )}
        </div>

        <div className="mt-5 border-t border-ink-100 px-4 py-4 sm:mt-6 sm:px-8 sm:py-5">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((v) => Math.max(1, v - 1))}
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-ink-200 bg-surface-elevated px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </button>
            ) : (
              <div aria-hidden="true" className="hidden sm:block" />
            )}

            {step < STEPS.length ? (
              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:w-auto"
              >
                Continue
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:w-auto"
              >
                Create paper
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
