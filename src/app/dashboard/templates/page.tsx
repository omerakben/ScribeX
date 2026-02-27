"use client";

import { useState } from "react";
import {
  BookOpen,
  FileText,
  FlaskConical,
  GraduationCap,
  Presentation,
  ScrollText,
  Search,
  WandSparkles,
} from "lucide-react";
import { TopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
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

  const handleUseTemplate = (template: PaperTemplate) => {
    setSelectedTemplate(template);
    setDialogOpen(true);
  };

  return (
    <>
      <TopBar
        title="Templates"
        subtitle="Choose a paper scaffold that fits your target submission format."
        showSearch={false}
      />

      <div className="flex flex-1 flex-col overflow-auto px-5 pb-8 pt-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-mercury-200 bg-mercury-50/80 p-4">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.11em] text-mercury-800">
            <WandSparkles className="h-3.5 w-3.5" />
            Template intelligence
          </p>
          <p className="mt-2 text-sm text-mercury-900">
            Templates initialize section architecture, citation defaults, and writing guidance for faster first drafts.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(Object.entries(PAPER_TEMPLATES) as Array<[
            PaperTemplate,
            (typeof PAPER_TEMPLATES)[PaperTemplate],
          ]>).map(([key, template]) => {
            const Icon = templateIcons[key];

            return (
              <article key={key} className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-surface-secondary text-brand-700">
                  <Icon className="h-4 w-4" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-ink-950">{template.label}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{template.description}</p>

                {template.sections.length > 0 ? (
                  <ul className="mt-4 space-y-1.5 text-sm text-ink-700">
                    {template.sections.slice(0, 4).map((section) => (
                      <li key={section}>• {section}</li>
                    ))}
                    {template.sections.length > 4 ? (
                      <li className="text-xs text-ink-500">+ {template.sections.length - 4} additional sections</li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-ink-500">Blank start. Build your own section hierarchy.</p>
                )}

                <Button onClick={() => handleUseTemplate(key)} className="mt-5 w-full" variant="outline">
                  Use template
                </Button>
              </article>
            );
          })}
        </div>
      </div>

      <NewPaperDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
