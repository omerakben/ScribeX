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

      <div className="flex flex-1 flex-col overflow-auto p-8">
        <div className="max-w-6xl w-full mx-auto">

          {/* Template grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
            {(Object.entries(PAPER_TEMPLATES) as Array<[
              PaperTemplate,
              (typeof PAPER_TEMPLATES)[PaperTemplate],
            ]>).map(([key, template]) => {
              const Icon = templateIcons[key];
              const visibleSections = template.sections.slice(0, 3);
              const extraCount = template.sections.length - 3;
              const sectionPreview = visibleSections.join(" · ") + (extraCount > 0 ? ` +${extraCount} more` : "");

              return (
                <article
                  key={key}
                  className="group bg-white border border-ink-200 rounded-xl p-5 hover:border-brand-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => handleUseTemplate(key)}
                >
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-lg bg-ink-50 group-hover:bg-brand-50 flex items-center justify-center mb-4 transition-colors duration-200">
                    <Icon className="w-4.5 h-4.5 text-ink-400 group-hover:text-brand-600 transition-colors duration-200" />
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-medium text-ink-900">{template.label}</h2>

                  {/* Description */}
                  <p className="text-sm text-ink-500 mt-1.5 line-clamp-2">{template.description}</p>

                  {/* Sections preview */}
                  <div className="mt-4 pt-3 border-t border-ink-100">
                    {template.sections.length > 0 ? (
                      <p className="text-xs text-ink-400 truncate">{sectionPreview}</p>
                    ) : (
                      <p className="text-xs text-ink-400">No predefined sections</p>
                    )}
                  </div>

                  {/* Use template action */}
                  <p className="mt-3 text-xs font-semibold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Use template →
                  </p>
                </article>
              );
            })}
          </div>

        </div>
      </div>

      <NewPaperDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
