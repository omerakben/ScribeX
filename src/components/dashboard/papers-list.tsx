"use client";

import { useMemo } from "react";
import { Plus, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useEditorStore, useDashboardStore } from "@/lib/store/editor-store";
import { PaperCard } from "@/components/dashboard/paper-card";

interface PapersListProps {
  onNewPaper: () => void;
}

export function PapersList({ onNewPaper }: PapersListProps) {
  const papers = useEditorStore((s) => s.papers);
  const searchQuery = useDashboardStore((s) => s.searchQuery);

  const filteredPapers = useMemo(() => {
    if (!searchQuery.trim()) return papers;
    const q = searchQuery.toLowerCase();
    return papers.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.field?.toLowerCase().includes(q) ||
        p.targetJournal?.toLowerCase().includes(q)
    );
  }, [papers, searchQuery]);

  // Sort by most recently updated
  const sortedPapers = useMemo(
    () =>
      [...filteredPapers].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [filteredPapers]
  );

  if (papers.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-sm text-center"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950">
            <FileText className="h-8 w-8 text-brand-500" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-ink-900 dark:text-ink-100">
            No papers yet
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
            Create your first paper and start writing with the power of Mercury
            AI. Your papers are saved locally and ready whenever you are.
          </p>
          <Button onClick={onNewPaper}>
            <Plus className="h-4 w-4" />
            Create your first paper
          </Button>
        </motion.div>
      </div>
    );
  }

  if (sortedPapers.length === 0 && searchQuery.trim()) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="mx-auto max-w-sm text-center">
          <p className="mb-1 text-sm font-medium text-ink-700 dark:text-ink-300">
            No results found
          </p>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            No papers match &ldquo;{searchQuery}&rdquo;. Try a different search
            term.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {sortedPapers.map((paper, i) => (
        <PaperCard key={paper.id} paper={paper} index={i} />
      ))}
    </div>
  );
}
