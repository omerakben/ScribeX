"use client";

import { useCallback, useRef, useState } from "react";
import { BookOpen, ExternalLink, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
      const res = await fetch(
        `/api/citations?q=${encodeURIComponent(trimmed)}&limit=10`,
        { signal: controller.signal }
      );

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      setResults(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setResults([]);
        setTotal(0);
      }
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch]
  );

  const formatAuthors = (citation: Citation) => {
    const authors = citation.authors;
    if (authors.length === 0) return "Unknown";
    if (authors.length === 1) return authors[0].name;
    if (authors.length === 2) return `${authors[0].name} & ${authors[1].name}`;
    return `${authors[0].name} et al.`;
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search papers..."
            className="pl-8"
            inputSize="sm"
          />
        </div>
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          loading={isSearching}
        >
          Search
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {isSearching && (
          <div className="flex items-center justify-center py-8 text-ink-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm">Searching Semantic Scholar...</span>
          </div>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-ink-500">
            <BookOpen className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No papers found</p>
            <p className="text-xs text-ink-400">Try different search terms</p>
          </div>
        )}

        {!isSearching && hasSearched && results.length > 0 && (
          <p className="text-xs text-ink-500 px-1">
            {total.toLocaleString()} results found
          </p>
        )}

        {results.map((citation) => (
          <div
            key={citation.id}
            className={cn(
              "rounded-lg border border-ink-200 bg-surface p-3 space-y-1.5",
              "hover:border-ink-300 transition-colors",
              "dark:border-ink-700 dark:hover:border-ink-600"
            )}
          >
            <h4 className="text-sm font-medium leading-snug text-ink-900 dark:text-ink-100">
              {citation.title}
            </h4>
            <p className="text-xs text-ink-600 dark:text-ink-400">
              {formatAuthors(citation)}
              {citation.year ? ` (${citation.year})` : ""}
            </p>
            {citation.venue && (
              <p className="text-xs text-ink-500 italic truncate">
                {citation.venue}
              </p>
            )}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {citation.citationCount.toLocaleString()} citations
                </Badge>
                {citation.isOpenAccess && (
                  <Badge
                    variant="success"
                    className="text-[10px] px-1.5 py-0"
                  >
                    Open Access
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {citation.url && (
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-400 hover:text-ink-600 transition-colors"
                    aria-label={`Open ${citation.title} externally`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs px-2"
                  onClick={() => onInsert(citation)}
                >
                  Insert
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
