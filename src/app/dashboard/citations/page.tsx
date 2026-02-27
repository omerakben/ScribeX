"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Trash2 } from "lucide-react";
import { TopBar } from "@/components/dashboard/top-bar";
import { CitationSearch } from "@/components/editor/citation-search";
import { getCitationEntityId } from "@/lib/constants";
import type { Citation } from "@/lib/types";

export default function CitationsPage() {
  const [library, setLibrary] = useState<Citation[]>([]);

  const totalCitations = useMemo(() => library.length, [library]);

  const handleInsert = (citation: Citation) => {
    const citationId = getCitationEntityId(citation);
    setLibrary((prev) => {
      if (prev.some((entry) => getCitationEntityId(entry) === citationId)) return prev;
      return [citation, ...prev];
    });
  };

  return (
    <>
      <TopBar
        title="Citations"
        subtitle="Search and manage your references"
        showSearch={false}
      />

      <div className="flex flex-1 min-h-0 flex-col overflow-auto p-8">
        <div className="max-w-6xl w-full mx-auto">

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

            {/* Left: Search card */}
            <div className="bg-white border border-ink-200 rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink-900 mb-4">Search</h2>
              <div className="h-[560px] min-h-0">
                <CitationSearch onInsert={handleInsert} />
              </div>
            </div>

            {/* Right: Reference Queue card */}
            <div className="bg-white border border-ink-200 rounded-xl p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-base font-semibold text-ink-900">Reference Queue</h2>
                <span className="bg-ink-100 text-ink-600 text-xs px-2 py-0.5 rounded-full">
                  {totalCitations}
                </span>
              </div>

              {library.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-ink-400 text-center py-8">No references saved yet</p>
                </div>
              ) : (
                <div className="flex-1 overflow-auto space-y-3">
                  {library.map((citation) => (
                    <article
                      key={getCitationEntityId(citation)}
                      className="rounded-lg border border-ink-200 bg-ink-50 p-3"
                    >
                      <p className="line-clamp-2 text-sm text-ink-700 font-medium">{citation.title}</p>
                      <p className="mt-1 text-xs text-ink-500">
                        {citation.authors[0]?.name ?? "Unknown"}
                        {citation.year ? ` (${citation.year})` : ""}
                      </p>
                    </article>
                  ))}
                </div>
              )}

              {/* Bottom actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-ink-100">
                <button
                  type="button"
                  disabled={library.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:border-ink-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Export
                </button>
                <button
                  type="button"
                  disabled={library.length === 0}
                  onClick={() => setLibrary([])}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-ink-500 hover:text-ink-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
