"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDashboardStore } from "@/lib/store/editor-store";

interface TopBarProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, showSearch = true, actions }: TopBarProps) {
  const { searchQuery, setSearchQuery } = useDashboardStore();

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-ink-100 bg-white/80 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between gap-3 px-5 lg:px-8">
        {/* Page title */}
        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-none text-ink-950">{title}</h1>
          {subtitle ? (
            <p className="mt-0.5 truncate text-sm text-ink-500">{subtitle}</p>
          ) : null}
        </div>

        {/* Right controls */}
        <div className="flex shrink-0 items-center gap-3">
          {actions ? actions : null}
          {showSearch ? (
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search papers…"
                className="h-8 w-64 rounded-lg border-ink-200 bg-ink-50 pl-9 text-sm placeholder:text-ink-400 focus:border-ink-300 focus:bg-white"
                aria-label="Search papers"
              />
            </div>
          ) : null}

          {/* User avatar */}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-200 text-xs font-medium text-ink-600"
            aria-label="User account"
          >
            OA
          </div>
        </div>
      </div>
    </header>
  );
}
