"use client";

import { useCallback, useRef, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import type { Citation } from "@/lib/types";

interface CitationSearchProps {
  onInsert: (citation: Citation) => void;
}

export function CitationSearch({ onInsert }: CitationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Citation[]>([]);
  const [total, setTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/citations?q=${encodeURIComponent(trimmed)}&limit=10`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Failed to fetch citations");

      const data = await response.json();
      setResults(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setResults([]);
        setTotal(0);
      }
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const formatAuthors = (citation: Citation) => {
    if (citation.authors.length === 0) return "Unknown";
    if (citation.authors.length === 1) return citation.authors[0].name;
    if (citation.authors.length === 2) return `${citation.authors[0].name} & ${citation.authors[1].name}`;
    return `${citation.authors[0].name} et al.`;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSearch();
            }
          }}
          placeholder="Search papers, topics, or DOI"
          className="flex-1 border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-ink-400 font-sans text-ink-800"
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          className="inline-flex items-center gap-1.5 bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-ink-400" />
          </div>
        ) : null}

        {!isSearching && hasSearched && results.length === 0 ? (
          <p className="text-sm text-ink-400 text-center py-8">No references found</p>
        ) : null}

        {!isSearching && hasSearched && results.length > 0 ? (
          <p className="text-xs text-ink-400 pb-1">{total.toLocaleString()} results</p>
        ) : null}

        {results.map((citation) => (
          <article
            key={citation.id}
            className="border border-ink-200 rounded-lg p-3 hover:border-ink-300 transition-colors"
          >
            <h3 className="text-sm font-medium text-ink-900 line-clamp-2">{citation.title}</h3>

            <p className="text-xs text-ink-500 mt-1 line-clamp-1">
              {formatAuthors(citation)}
            </p>

            <div className="flex items-center gap-3 mt-2 text-xs text-ink-400">
              {citation.year ? <span>{citation.year}</span> : null}
              {citation.venue ? <span className="line-clamp-1">{citation.venue}</span> : null}
              {citation.citationCount > 0 ? (
                <span>{citation.citationCount.toLocaleString()} cites</span>
              ) : null}
              {citation.isOpenAccess ? (
                <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                  Open Access
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex gap-2">
              <button
                onClick={() => onInsert(citation)}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Insert
              </button>
              {citation.url ? (
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-ink-400 hover:text-ink-600 transition-colors"
                  aria-label={`Open ${citation.title} in new tab`}
                >
                  <ExternalLink className="h-3 w-3" />
                  View
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
