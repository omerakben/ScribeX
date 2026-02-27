"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  draft: "bg-ink-100 text-ink-700",
  "in-review": "bg-blue-100 text-blue-800",
  revision: "bg-amber-100 text-amber-800",
  final: "bg-green-100 text-green-800",
  published: "bg-brand-100 text-brand-800",
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

export function PaperCard({ paper, index }: PaperCardProps) {
  const router = useRouter();
  const papers = useEditorStore((s) => s.papers);
  const setPapers = useEditorStore((s) => s.setPapers);

  const metadata = useMemo(
    () => ({
      updatedLabel: relativeTime(paper.updatedAt),
      templateLabel: PAPER_TEMPLATES[paper.template]?.label ?? paper.template,
    }),
    [paper]
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
    setPapers(papers.filter((entry) => entry.id !== paper.id));
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group rounded-2xl border border-ink-200 bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={handleOpen}
          className="flex-1 text-left"
          aria-label={`Open ${paper.title}`}
        >
          <h3 className="line-clamp-2 text-base font-semibold text-ink-950">{paper.title}</h3>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-lg border border-transparent p-1.5 text-ink-500 transition hover:border-ink-300 hover:bg-white hover:text-ink-900"
              aria-label={`Actions for ${paper.title}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleOpen}>
              <ExternalLink className="h-4 w-4" />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4" />
              Export
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-error focus:text-error">
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize", statusClasses[paper.status])}>
          {paper.status}
        </span>
        <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-700">
          {metadata.templateLabel}
        </span>
        <span className="rounded-full bg-mercury-100 px-2.5 py-1 text-[11px] font-semibold text-mercury-800">
          {paper.citationStyle.toUpperCase()}
        </span>
      </div>

      <div className="mt-4 space-y-1 text-xs text-ink-500">
        {paper.field ? <p>Field: {paper.field}</p> : null}
        {paper.targetJournal ? <p>Target journal: {paper.targetJournal}</p> : null}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-ink-200 pt-4 text-sm text-ink-600">
        <span>{paper.wordCount.toLocaleString()} words</span>
        <span className="font-medium">Updated {metadata.updatedLabel}</span>
      </div>
    </motion.article>
  );
}
