"use client";

import { useMemo, useState } from "react";
import { BookMarked, ClipboardList, Trash2 } from "lucide-react";
import { TopBar } from "@/components/dashboard/top-bar";
import { CitationSearch } from "@/components/editor/citation-search";
import { Button } from "@/components/ui/button";
import type { Citation } from "@/lib/types";

export default function CitationsPage() {
  const [library, setLibrary] = useState<Citation[]>([]);

  const totalCitations = useMemo(() => library.length, [library]);

  const handleInsert = (citation: Citation) => {
    setLibrary((prev) => {
      if (prev.some((entry) => entry.paperId === citation.paperId)) return prev;
      return [citation, ...prev];
    });
  };

  return (
    <>
      <TopBar
        title="Citations"
        subtitle="Search literature, pin references, and prepare citation sets for writing sessions."
        showSearch={false}
      />

      <div className="flex flex-1 min-h-0 flex-col overflow-auto px-5 pb-8 pt-6 lg:px-8">
        <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="min-h-0 rounded-2xl border border-ink-200 bg-white p-4 shadow-sm md:p-5">
            <h2 className="text-lg font-semibold text-ink-950">Literature search</h2>
            <p className="mt-1 text-sm text-ink-600">Powered by Semantic Scholar integration.</p>
            <div className="mt-4 h-[560px] min-h-0">
              <CitationSearch onInsert={handleInsert} />
            </div>
          </section>

          <aside className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-950">Reference queue</h2>
              <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">
                {totalCitations}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-600">Saved citations can be inserted directly from the editor panel.</p>

            {library.length === 0 ? (
              <div className="mt-10 rounded-2xl border border-ink-200 bg-surface-secondary px-4 py-8 text-center">
                <BookMarked className="mx-auto h-7 w-7 text-ink-500" />
                <p className="mt-3 text-sm font-semibold text-ink-900">No saved references yet</p>
                <p className="mt-1 text-sm text-ink-500">Search and insert papers to build a working citation queue.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {library.map((citation) => (
                  <article key={citation.paperId} className="rounded-xl border border-ink-200 bg-surface-secondary p-3">
                    <p className="line-clamp-2 text-sm font-semibold text-ink-900">{citation.title}</p>
                    <p className="mt-1 text-xs text-ink-600">
                      {citation.authors[0]?.name ?? "Unknown"}
                      {citation.year ? ` (${citation.year})` : ""}
                    </p>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" disabled={library.length === 0}>
                <ClipboardList className="h-4 w-4" />
                Export list
              </Button>
              <Button
                variant="ghost"
                className="gap-2"
                disabled={library.length === 0}
                onClick={() => setLibrary([])}
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
