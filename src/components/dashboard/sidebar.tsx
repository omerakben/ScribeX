"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FileText,
  Layout,
  PenLine,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanTier } from "@/lib/types";

const navGroups = [
  {
    heading: "Workspace",
    items: [
      { href: "/dashboard", label: "Papers", icon: FileText },
      { href: "/dashboard/templates", label: "Templates", icon: Layout },
      { href: "/dashboard/citations", label: "Citations", icon: BookOpen },
    ],
  },
  {
    heading: "Settings",
    items: [{ href: "/dashboard/settings", label: "Settings", icon: Settings }],
  },
];

interface SidebarProps {
  plan?: PlanTier;
  tokensUsedToday?: number;
}

function formatTokenCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return value.toString();
}

export function Sidebar({ plan = "scholar", tokensUsedToday = 12_400 }: SidebarProps) {
  const pathname = usePathname();
  const planConfig = PLAN_LIMITS[plan];

  const usagePct =
    planConfig.tokensPerDay === Infinity
      ? 0
      : Math.min((tokensUsedToday / planConfig.tokensPerDay) * 100, 100);

  return (
    <aside className="hidden h-full w-[220px] shrink-0 flex-col border-r border-ink-200 bg-white lg:flex">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-ink-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
          <PenLine className="h-3.5 w-3.5 text-white" />
        </div>
        <Link href="/dashboard" className="inline-block">
          <span className="font-serif text-base font-semibold text-ink-950">ScribeX</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3" aria-label="Dashboard navigation">
        {navGroups.map((group) => (
          <div key={group.heading} className="mb-4">
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-ink-300">
              {group.heading}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                        active
                          ? "bg-brand-50 font-medium text-brand-700"
                          : "text-ink-500 hover:bg-ink-50 hover:text-ink-800"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-brand-600" : "text-ink-400"
                        )}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom — plan indicator */}
      <div className="border-t border-ink-100 p-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-medium text-ink-600">
            {plan.charAt(0).toUpperCase() + plan.slice(1)} plan
          </p>
          {planConfig.tokensPerDay !== Infinity && (
            <p className="text-xs text-ink-400">
              {formatTokenCount(tokensUsedToday)} used
            </p>
          )}
        </div>
        {planConfig.tokensPerDay !== Infinity && (
          <div
            className="h-1 overflow-hidden rounded-full bg-ink-100"
            role="progressbar"
            aria-valuenow={usagePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Daily token usage"
          >
            <div
              style={{ width: `${usagePct}%` }}
              className="h-full rounded-full bg-brand-500 transition-all duration-150"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
