"use client";

import { Bell, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDashboardStore } from "@/lib/store/editor-store";

interface TopBarProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
}

export function TopBar({ title, subtitle, showSearch = true }: TopBarProps) {
  const { searchQuery, setSearchQuery } = useDashboardStore();

  return (
    <header className="sticky top-0 z-20 border-b border-ink-200/70 bg-white/88 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 lg:px-8">
        <div className="min-w-[220px]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">Workspace</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold leading-none text-ink-950">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-ink-600">{subtitle}</p> : null}
        </div>

        <div className="flex w-full flex-1 items-center justify-end gap-3 md:w-auto">
          {showSearch ? (
            <div className="relative w-full max-w-sm md:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, field, or journal"
                className="h-10 border-ink-300 bg-white pl-9"
                aria-label="Search papers"
              />
            </div>
          ) : null}

          <button
            className="relative rounded-xl border border-ink-300 bg-white p-2.5 text-ink-600 transition hover:border-ink-400 hover:text-ink-900"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-mercury-400" />
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-xl border border-ink-300 bg-white px-3 py-2 text-sm font-semibold text-ink-700 transition hover:border-ink-400 hover:text-ink-900"
            aria-label="Workspace account"
          >
            <Sparkles className="h-4 w-4 text-brand-600" />
            OA
          </button>
        </div>
      </div>
    </header>
  );
}
