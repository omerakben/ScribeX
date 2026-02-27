"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { JoinGate } from "@/components/shared/join-gate";
import { useHydration } from "@/hooks/use-hydration";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const isHydrated = useHydration();

  return (
    <JoinGate>
      <div className="flex h-screen overflow-hidden bg-ink-50">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col overflow-auto">
          {isHydrated ? (
            children
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            </div>
          )}
        </main>
      </div>
    </JoinGate>
  );
}
