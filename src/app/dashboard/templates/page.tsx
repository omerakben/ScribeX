"use client";

import { useState, type CSSProperties } from "react";
import {
  ArrowRight,
  BookOpen,
  FileText,
  FlaskConical,
  GraduationCap,
  Presentation,
  ScrollText,
  Search,
} from "lucide-react";
import { TopBar } from "@/components/dashboard/top-bar";
import { PAPER_TEMPLATES } from "@/lib/constants";
import { useDashboardStore } from "@/lib/store/editor-store";
import type { PaperTemplate } from "@/lib/types";
import { NewPaperDialog } from "@/components/dashboard/new-paper-dialog";

const templateIcons: Record<PaperTemplate, React.ComponentType<{ className?: string }>> = {
  blank: FileText,
  imrad: FlaskConical,
  "literature-review": BookOpen,
  "systematic-review": Search,
  "grant-proposal": ScrollText,
  "thesis-chapter": GraduationCap,
  "conference-paper": Presentation,
};

export default function TemplatesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const setSelectedTemplate = useDashboardStore((s) => s.setSelectedTemplate);
  const templates = Object.entries(PAPER_TEMPLATES) as Array<
    [PaperTemplate, (typeof PAPER_TEMPLATES)[PaperTemplate]]
  >;
  const structuredTemplateCount = templates.filter(([, template]) => template.sections.length > 0).length;

  const handleUseTemplate = (template: PaperTemplate) => {
    setSelectedTemplate(template);
    setDialogOpen(true);
  };

  return (
    <>
      <TopBar
        title="Templates"
        subtitle="Start with a structured foundation"
        showSearch={false}
      />

      <main className="flex flex-1 flex-col overflow-auto">
        <div className="templates-page-shell mx-auto w-full max-w-6xl px-4 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-7 lg:px-8 lg:pb-12">
          <section className="templates-intro-panel p-5 sm:p-6 lg:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
              Template Library
            </p>

            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <h1 className="font-serif text-2xl leading-tight text-ink-900 sm:text-[2.05rem]">
                  Choose a structured starting point
                </h1>
                <p className="mt-2 text-sm leading-6 text-ink-600 sm:text-base">
                  Select a manuscript template to prefill section scaffolding and keep your draft aligned with
                  standard academic conventions from the first paragraph.
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="rounded-lg border border-ink-200 bg-surface-secondary px-3.5 py-2.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">Total</dt>
                  <dd className="mt-1 text-base font-semibold text-ink-900">{templates.length}</dd>
                </div>
                <div className="rounded-lg border border-ink-200 bg-surface-secondary px-3.5 py-2.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">Structured</dt>
                  <dd className="mt-1 text-base font-semibold text-ink-900">{structuredTemplateCount}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section aria-labelledby="templates-grid-heading" className="mt-6 sm:mt-8">
            <h2 id="templates-grid-heading" className="sr-only">
              Available templates
            </h2>

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-6">
              {templates.map(([key, template], index) => {
                const Icon = templateIcons[key];
                const visibleSections = template.sections.slice(0, 3);
                const extraCount = template.sections.length - visibleSections.length;
                const sectionPreview = `${visibleSections.join(" · ")}${extraCount > 0 ? ` +${extraCount} more` : ""}`;
                const hasSections = template.sections.length > 0;
                const descriptionId = `${key}-description`;
                const sectionsId = `${key}-sections`;

                return (
                  <li key={key} className="min-h-0">
                    <button
                      type="button"
                      onClick={() => handleUseTemplate(key)}
                      className="template-card template-card-enter group flex h-full w-full flex-col items-start p-5 text-left sm:p-6"
                      style={{ "--template-delay": `${index * 45}ms` } as CSSProperties}
                      aria-describedby={hasSections ? `${descriptionId} ${sectionsId}` : descriptionId}
                    >
                      <span className="flex w-full items-start justify-between gap-3">
                        <span className="template-icon-wrap flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
                          <Icon className="h-4.5 w-4.5 text-ink-500" />
                        </span>

                        <span className="inline-flex shrink-0 rounded-full border border-ink-200 bg-surface-secondary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-500">
                          {hasSections ? `${template.sections.length} sections` : "Freeform"}
                        </span>
                      </span>

                      <span className="mt-4 block text-base font-semibold leading-snug text-ink-900">
                        {template.label}
                      </span>

                      <span id={descriptionId} className="mt-2 block text-sm leading-6 text-ink-600">
                        {template.description}
                      </span>

                      <span className="mt-4 w-full rounded-lg border border-ink-100 bg-surface-secondary px-3 py-2.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                          Section preview
                        </span>
                        <span id={sectionsId} className="mt-1 block text-xs leading-5 text-ink-600">
                          {hasSections
                            ? sectionPreview
                            : "No predefined sections. Best for custom structures and exploratory drafts."}
                        </span>
                      </span>

                      <span className="template-card-cta mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                        Use template
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transform-none" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </main>

      <NewPaperDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
