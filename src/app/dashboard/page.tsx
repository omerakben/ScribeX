"use client";

import { useMemo, useState } from "react";
import { Clock, FileText, Plus, Type } from "lucide-react";
import { PapersList } from "@/components/dashboard/papers-list";
import { NewPaperDialog } from "@/components/dashboard/new-paper-dialog";
import { TopBar } from "@/components/dashboard/top-bar";
import { useEditorStore } from "@/lib/store/editor-store";

export default function DashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const papers = useEditorStore((s) => s.papers);

  const totalWords = useMemo(
    () => papers.reduce((total, paper) => total + paper.wordCount, 0),
    [papers]
  );

  const recentlyUpdated = useMemo(() => {
    if (papers.length === 0) return "No updates yet";
    const latest = [...papers].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
    return latest.title;
  }, [papers]);

  const newPaperButton = (
    <button
      onClick={() => setDialogOpen(true)}
      className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150"
    >
      <Plus className="w-4 h-4" />
      New Paper
    </button>
  );

  return (
    <>
    <TopBar
      title="Papers"
      subtitle="Manage your manuscripts"
      actions={newPaperButton}
    />
    <div className="flex flex-1 flex-col overflow-auto p-8">
      <div className="max-w-6xl w-full mx-auto">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-ink-200 rounded-xl p-5 flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-brand-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink-950">{papers.length}</p>
              <p className="text-xs text-ink-500 mt-0.5">Total papers</p>
            </div>
          </div>
          <div className="bg-white border border-ink-200 rounded-xl p-5 flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-mercury-50 flex items-center justify-center shrink-0">
              <Type className="h-4 w-4 text-mercury-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink-950">{totalWords.toLocaleString()}</p>
              <p className="text-xs text-ink-500 mt-0.5">Total words</p>
            </div>
          </div>
          <div className="bg-white border border-ink-200 rounded-xl p-5 flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-ink-100 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-ink-500" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-ink-950 line-clamp-1">{recentlyUpdated}</p>
              <p className="text-xs text-ink-500 mt-0.5">Last updated</p>
            </div>
          </div>
        </div>

        {/* Library section */}
        <div className="mt-8">
          <p className="text-sm font-medium text-ink-700 mb-4">Your manuscripts</p>
          <PapersList onNewPaper={() => setDialogOpen(true)} />
        </div>
      </div>

      <NewPaperDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
    </>
  );
}
