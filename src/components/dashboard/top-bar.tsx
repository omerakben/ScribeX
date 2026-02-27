"use client";

import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDashboardStore } from "@/lib/store/editor-store";

export function TopBar() {
  const { searchQuery, setSearchQuery } = useDashboardStore();

  return (
    <header className="flex h-14 items-center justify-between border-b border-ink-200 bg-surface px-6 dark:border-ink-700">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <Input
          type="search"
          placeholder="Search papers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          aria-label="Search papers"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button
          className="relative rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-200"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Avatar */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-200 dark:bg-brand-900 dark:text-brand-300 dark:hover:bg-brand-800"
          aria-label="User menu"
        >
          O
        </button>
      </div>
    </header>
  );
}
