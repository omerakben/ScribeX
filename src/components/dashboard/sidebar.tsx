"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Files,
  Gauge,
  LayoutTemplate,
  LibraryBig,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanTier } from "@/lib/types";

const navGroups = [
  {
    heading: "Workspace",
    items: [
      { href: "/dashboard", label: "Papers", icon: Files },
      { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
      { href: "/dashboard/citations", label: "Citations", icon: BookOpen },
    ],
  },
  {
    heading: "Administration",
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
    <aside className="hidden h-full w-[284px] shrink-0 border-r border-ink-200/70 bg-surface-secondary/90 p-4 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="rounded-2xl border border-ink-200 bg-white/90 p-4 shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-brand-300/60 bg-brand-600 text-white shadow-glow-brand">
            <span className="font-serif text-lg font-semibold">S</span>
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-mercury-300" />
          </div>
          <div>
            <p className="font-serif text-2xl font-semibold tracking-tight text-ink-950">ScribeX</p>
            <p className="text-xs uppercase tracking-[0.12em] text-ink-500">Research Workspace</p>
          </div>
        </Link>

        <div className="mt-4 rounded-xl border border-mercury-200 bg-mercury-50/70 px-3 py-2 text-xs text-mercury-800">
          <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.11em]">
            <Sparkles className="h-3.5 w-3.5" />
            Model Route
          </span>
          <p className="mt-1 text-mercury-900">mercury-2 + mercury-edit</p>
        </div>
      </div>

      <nav className="mt-5 space-y-5" aria-label="Dashboard navigation">
        {navGroups.map((group) => (
          <div key={group.heading}>
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-ink-500">{group.heading}</p>
            <ul className="mt-2 space-y-1.5">
              {group.items.map((item) => {
                const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                        active
                          ? "bg-brand-600 text-white shadow-md"
                          : "text-ink-700 hover:bg-white hover:text-ink-900"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      {active && <Gauge className="h-3.5 w-3.5" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.11em] text-ink-500">Current Plan</p>
            <span className="rounded-full bg-brand-100 px-2 py-1 text-[11px] font-semibold capitalize text-brand-700">
              {plan}
            </span>
          </div>

          {planConfig.tokensPerDay !== Infinity && (
            <>
              <p className="mt-3 text-sm font-semibold text-ink-900">
                {formatTokenCount(tokensUsedToday)} / {formatTokenCount(planConfig.tokensPerDay)} tokens
              </p>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-ink-200"
                role="progressbar"
                aria-valuenow={usagePct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Daily token usage"
              >
                <div
                  style={{ width: `${usagePct}%` }}
                  className={cn(
                    "h-full rounded-full transition-all",
                    usagePct > 80 ? "bg-error" : usagePct > 55 ? "bg-warning" : "bg-mercury-500"
                  )}
                />
              </div>
              <p className="mt-2 text-xs text-ink-500">Usage resets at midnight local time.</p>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.11em] text-ink-500">
            <LibraryBig className="h-3.5 w-3.5 text-brand-600" />
            Writing Focus
          </p>
          <p className="mt-2 text-sm text-ink-700">
            Keep section headings explicit to improve review and outline quality.
          </p>
        </div>
      </div>
    </aside>
  );
}
