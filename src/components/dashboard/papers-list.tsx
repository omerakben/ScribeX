"use client";

import { useMemo } from "react";
import { FileText, Plus, SearchX } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="w-10 h-10 text-ink-300 mb-4" />
        <h3 className="text-base font-medium text-ink-700">No papers yet</h3>
        <p className="text-sm text-ink-500 mt-1">Create your first manuscript to get started.</p>
        <button
          onClick={onNewPaper}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 mt-4"
        >
          <Plus className="w-4 h-4" />
          Create paper
        </button>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchX className="w-10 h-10 text-ink-300 mb-4" />
        <h3 className="text-base font-medium text-ink-700">No results found</h3>
        <p className="text-sm text-ink-500 mt-1">Try searching by title, field, or target journal.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {sorted.map((paper, index) => (
        <PaperCard key={paper.id} paper={paper} index={index} />
      ))}
    </div>
  );
}
