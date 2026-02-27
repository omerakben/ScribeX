"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, SearchX, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardStore, useEditorStore } from "@/lib/store/editor-store";
import { PaperCard } from "@/components/dashboard/paper-card";

interface PapersListProps {
  onNewPaper: () => void;
}

export function PapersList({ onNewPaper }: PapersListProps) {
  const papers = useEditorStore((s) => s.papers);
  const searchQuery = useDashboardStore((s) => s.searchQuery);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return papers;

    const query = searchQuery.toLowerCase();
    return papers.filter(
      (paper) =>
        paper.title.toLowerCase().includes(query) ||
        paper.field?.toLowerCase().includes(query) ||
        paper.targetJournal?.toLowerCase().includes(query)
    );
  }, [papers, searchQuery]);

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [filtered]
  );

  if (papers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-xl rounded-3xl border border-ink-200 bg-surface-secondary p-10 text-center"
      >
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-mercury-300 bg-mercury-50">
          <Sparkles className="h-7 w-7 text-mercury-700" />
        </div>
        <h3 className="mt-5 text-2xl font-semibold text-ink-950">Start your first manuscript</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-600">
          Create a paper with template scaffolding, citation style defaults, and Mercury-powered drafting right away.
        </p>
        <Button onClick={onNewPaper} variant="mercury" className="mt-6 gap-2">
          <Plus className="h-4 w-4" />
          Create first paper
        </Button>
      </motion.div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-ink-200 bg-surface-secondary">
          <SearchX className="h-6 w-6 text-ink-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-ink-900">No matching papers</h3>
        <p className="mt-2 text-sm text-ink-600">Try searching by field, title, or target journal.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {sorted.map((paper, index) => (
        <PaperCard key={paper.id} paper={paper} index={index} />
      ))}
    </div>
  );
}
