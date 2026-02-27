"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { JoinGate } from "@/components/shared/join-gate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <JoinGate>
      <div className="flex h-screen overflow-hidden bg-ink-50">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col overflow-auto">{children}</main>
      </div>
    </JoinGate>
  );
}
