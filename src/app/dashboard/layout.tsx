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
      <div className="flex h-screen overflow-hidden bg-surface">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </JoinGate>
  );
}
