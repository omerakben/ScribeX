"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Copy, Download, ExternalLink, MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PAPER_TEMPLATES } from "@/lib/constants";
import type { Paper, PaperStatus } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editor-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusClasses: Record<PaperStatus, string> = {
  draft: "bg-ink-100 text-ink-600",
  "in-review": "bg-amber-50 text-amber-700",
  revision: "bg-amber-50 text-amber-700",
  final: "bg-emerald-50 text-emerald-700",
  published: "bg-brand-50 text-brand-700",
};

function relativeTime(date: string) {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface PaperCardProps {
  paper: Paper;
  index: number;
}

export function PaperCard({ paper }: PaperCardProps) {
  const router = useRouter();
  const papers = useEditorStore((s) => s.papers);
  const setPapers = useEditorStore((s) => s.setPapers);
  const deletePaper = useEditorStore((s) => s.deletePaper);

  const metadata = useMemo(
    () => ({
      updatedLabel: relativeTime(paper.updatedAt),
      templateLabel: PAPER_TEMPLATES[paper.template]?.label ?? paper.template,
    }),
    [paper.updatedAt, paper.template]
  );

  const handleOpen = () => {
    router.push(`/editor/${paper.id}`);
  };

  const handleDuplicate = () => {
    const now = new Date().toISOString();

    setPapers([
      ...papers,
      {
        ...paper,
        id: crypto.randomUUID(),
        title: `${paper.title} (Copy)`,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      },
    ]);
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Delete "${paper.title}"? This cannot be undone.`
    );
    if (confirmed) {
      deletePaper(paper.id);
    }
  };

  return (
    <article
      className="bg-white border border-ink-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleOpen}
    >
      {/* Top row: title + dropdown */}
      <div className="flex justify-between items-start">
        <h3 className="text-base font-medium text-ink-900 line-clamp-1 hover:text-brand-600 transition-colors flex-1 pr-2">
          {paper.title}
        </h3>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-lg hover:bg-ink-100 flex items-center justify-center flex-shrink-0 transition-colors duration-150"
              aria-label={`Actions for ${paper.title}`}
            >
              <MoreHorizontal className="w-4 h-4 text-ink-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpen(); }}>
              <ExternalLink className="h-4 w-4" />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}>
              <Copy className="h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <Download className="h-4 w-4" />
              Export
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="text-error focus:text-error"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Middle: status + template badges */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "text-[11px] font-medium px-2 py-0.5 rounded-full capitalize",
            statusClasses[paper.status]
          )}
        >
          {paper.status}
        </span>
        {paper.template && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-ink-50 text-ink-600">
            {metadata.templateLabel}
          </span>
        )}
      </div>

      {/* Bottom: field + word count / time */}
      <div className="mt-4 pt-3 border-t border-ink-100 flex items-center justify-between">
        <span className="text-xs text-ink-400">
          {paper.field ?? "No field set"}
        </span>
        <span className="text-xs text-ink-400">
          {paper.wordCount.toLocaleString()} words &middot; {metadata.updatedLabel}
        </span>
      </div>
    </article>
  );
}
