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
      <div className="relative flex h-screen overflow-hidden bg-surface">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_4%_0%,rgba(78,115,244,0.12),transparent_34%),radial-gradient(circle_at_96%_6%,rgba(34,190,154,0.1),transparent_36%)]" />
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </JoinGate>
  );
}
