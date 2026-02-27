"use client";

import { useCallback, useRef, useState } from "react";
import { BookOpen, ExternalLink, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
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
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Search papers, topics, or DOI"
            className="h-9 pl-8"
            inputSize="sm"
          />
        </div>

        <Button size="sm" onClick={handleSearch} disabled={!query.trim() || isSearching} loading={isSearching}>
          Search
        </Button>
      </div>

      <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
        {isSearching ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Querying Semantic Scholar
          </div>
        ) : null}

        {!isSearching && hasSearched && results.length === 0 ? (
          <div className="rounded-xl border border-ink-200 bg-surface px-3 py-8 text-center">
            <BookOpen className="mx-auto h-7 w-7 text-ink-500" />
            <p className="mt-3 text-sm font-semibold text-ink-900">No references found</p>
            <p className="mt-1 text-xs text-ink-500">Try narrower keywords or alternate terminology.</p>
          </div>
        ) : null}

        {!isSearching && hasSearched && results.length > 0 ? (
          <p className="pb-1 text-xs text-ink-500">{total.toLocaleString()} results</p>
        ) : null}

        {results.map((citation) => (
          <article
            key={citation.id}
            className={cn(
              "rounded-xl border border-ink-200 bg-white p-3 transition",
              "hover:border-brand-300 hover:shadow-sm"
            )}
          >
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink-900">{citation.title}</h3>
            <p className="mt-1 text-xs text-ink-600">
              {formatAuthors(citation)}
              {citation.year ? ` (${citation.year})` : ""}
            </p>

            {citation.venue ? <p className="mt-1 line-clamp-1 text-xs italic text-ink-500">{citation.venue}</p> : null}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="border border-ink-300 bg-surface px-1.5 py-0 text-[10px]">
                  {citation.citationCount.toLocaleString()} cites
                </Badge>
                {citation.isOpenAccess ? (
                  <Badge variant="success" className="px-1.5 py-0 text-[10px]">
                    Open
                  </Badge>
                ) : null}
              </div>

              <div className="flex items-center gap-1.5">
                {citation.url ? (
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md p-1 text-ink-500 hover:bg-ink-100 hover:text-ink-800"
                    aria-label={`Open ${citation.title} in new tab`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onInsert(citation)}>
                  Insert
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
