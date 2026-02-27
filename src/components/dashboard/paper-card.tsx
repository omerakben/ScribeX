"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MoreHorizontal,
  ExternalLink,
  Copy,
  Download,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PAPER_TEMPLATES } from "@/lib/constants";
import type { Paper, PaperStatus } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editor-store";
import { useState, useRef, useEffect } from "react";

const STATUS_CONFIG: Record<
  PaperStatus,
  { label: string; dotColor: string; bgColor: string }
> = {
  draft: {
    label: "Draft",
    dotColor: "bg-ink-400",
    bgColor: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-400",
  },
  "in-review": {
    label: "In Review",
    dotColor: "bg-info",
    bgColor: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  revision: {
    label: "Revision",
    dotColor: "bg-warning",
    bgColor:
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  final: {
    label: "Final",
    dotColor: "bg-success",
    bgColor:
      "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  },
  published: {
    label: "Published",
    dotColor: "bg-brand-500",
    bgColor:
      "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
  },
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface PaperCardProps {
  paper: Paper;
  index: number;
}

export function PaperCard({ paper, index }: PaperCardProps) {
  const router = useRouter();
  const { papers, setPapers } = useEditorStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const status = STATUS_CONFIG[paper.status];
  const templateLabel =
    PAPER_TEMPLATES[paper.template]?.label ?? paper.template;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  const handleOpen = () => {
    router.push(`/editor/${paper.id}`);
  };

  const handleDuplicate = () => {
    const duplicate: Paper = {
      ...paper,
      id: crypto.randomUUID(),
      title: `${paper.title} (Copy)`,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPapers([...papers, duplicate]);
    setMenuOpen(false);
  };

  const handleDelete = () => {
    setPapers(papers.filter((p) => p.id !== paper.id));
    setMenuOpen(false);
  };

  const handleExport = () => {
    // Placeholder for export functionality
    setMenuOpen(false);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative rounded-lg border border-ink-200 bg-surface-elevated shadow-sm transition-shadow hover:shadow-md dark:border-ink-700"
    >
      {/* Clickable area */}
      <button
        onClick={handleOpen}
        className="w-full p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-lg"
        aria-label={`Open paper: ${paper.title}`}
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug text-ink-900 line-clamp-2 dark:text-ink-100">
            {paper.title}
          </h3>
        </div>

        {/* Badges */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              status.bgColor
            )}
          >
            <span
              className={cn("h-1.5 w-1.5 rounded-full", status.dotColor)}
              aria-hidden="true"
            />
            {status.label}
          </span>
          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-400">
            {templateLabel}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-ink-500 dark:text-ink-400">
          <span>{paper.wordCount.toLocaleString()} words</span>
          <span>{formatRelativeTime(paper.updatedAt)}</span>
        </div>
      </button>

      {/* Three-dot menu */}
      <div className="absolute right-3 top-3" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className={cn(
            "rounded-md p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800 dark:hover:text-ink-300",
            menuOpen
              ? "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
              : "opacity-0 group-hover:opacity-100"
          )}
          aria-label={`Actions for ${paper.title}`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-lg border border-ink-200 bg-surface-elevated py-1 shadow-lg dark:border-ink-700"
            role="menu"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpen();
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
              role="menuitem"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicate();
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
              role="menuitem"
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExport();
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
              role="menuitem"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            <div className="my-1 border-t border-ink-200 dark:border-ink-700" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-error hover:bg-red-50 dark:hover:bg-red-950"
              role="menuitem"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
}
