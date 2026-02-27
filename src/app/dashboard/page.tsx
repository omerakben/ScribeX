"use client";

import { useMemo, useState } from "react";
import { Clock3, FileSpreadsheet, Plus, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/dashboard/top-bar";
import { PapersList } from "@/components/dashboard/papers-list";
import { NewPaperDialog } from "@/components/dashboard/new-paper-dialog";
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

  return (
    <>
      <TopBar
        title="Papers"
        subtitle="Manage drafts, run reviews, and move manuscripts toward publication."
      />

      <div className="flex flex-1 flex-col overflow-auto px-5 pb-8 pt-6 lg:px-8">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.12em] text-ink-500">Total papers</p>
              <p className="mt-2 text-2xl font-semibold text-ink-950">{papers.length}</p>
              <p className="mt-1 text-sm text-ink-500">Across all templates and statuses</p>
            </div>
            <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.12em] text-ink-500">Total words</p>
              <p className="mt-2 text-2xl font-semibold text-ink-950">{totalWords.toLocaleString()}</p>
              <p className="mt-1 text-sm text-ink-500">Cumulative workspace output</p>
            </div>
            <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-1">
              <p className="text-xs uppercase tracking-[0.12em] text-ink-500">Most recent update</p>
              <p className="mt-2 line-clamp-1 text-lg font-semibold text-ink-950">{recentlyUpdated}</p>
              <p className="mt-1 text-sm text-ink-500">Latest paper with activity</p>
            </div>
          </div>

          <div className="flex gap-2 xl:flex-col xl:items-end">
            <Button variant="outline" className="gap-2">
              <Clock3 className="h-4 w-4" />
              Activity log
            </Button>
            <Button variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export index
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="gap-2" variant="mercury">
              <Plus className="h-4 w-4" />
              New Paper
            </Button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-4 shadow-sm md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.11em] text-ink-500">
                <ScrollText className="h-3.5 w-3.5 text-brand-600" />
                Library
              </p>
              <h2 className="mt-1 text-lg font-semibold text-ink-950">Manuscript workspace</h2>
            </div>
          </div>

          <PapersList onNewPaper={() => setDialogOpen(true)} />
        </div>
      </div>

      <NewPaperDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
