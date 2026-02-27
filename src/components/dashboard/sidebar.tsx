"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  LayoutTemplate,
  BookOpen,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanTier } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Papers", icon: FileText },
  { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/dashboard/citations", label: "Citations", icon: BookOpen },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const PLAN_COLORS: Record<PlanTier, string> = {
  scholar: "bg-ink-200 text-ink-700 dark:bg-ink-700 dark:text-ink-300",
  researcher: "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300",
  lab: "bg-mercury-100 text-mercury-700 dark:bg-mercury-900 dark:text-mercury-300",
  institution: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
};

interface SidebarProps {
  plan?: PlanTier;
  tokensUsedToday?: number;
}

export function Sidebar({
  plan = "scholar",
  tokensUsedToday = 12_400,
}: SidebarProps) {
  const pathname = usePathname();
  const limits = PLAN_LIMITS[plan];
  const tokenPercent =
    limits.tokensPerDay === Infinity
      ? 0
      : Math.min((tokensUsedToday / limits.tokensPerDay) * 100, 100);

  const formatTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
  };

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-ink-200 bg-surface-secondary dark:border-ink-700">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5">
        <Sparkles className="h-5 w-5 text-brand-600" />
        <span className="text-lg font-semibold tracking-tight text-ink-900 dark:text-ink-100">
          ScribeX
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2" aria-label="Dashboard navigation">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-200"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-ink-200 px-4 py-4 dark:border-ink-700">
        {/* Plan badge */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-ink-500 dark:text-ink-400">
            Current plan
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
              PLAN_COLORS[plan]
            )}
          >
            {plan}
          </span>
        </div>

        {/* Token usage */}
        {limits.tokensPerDay !== Infinity && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-ink-500 dark:text-ink-400">
                Tokens today
              </span>
              <span className="text-xs font-medium text-ink-700 dark:text-ink-300">
                {formatTokens(tokensUsedToday)} / {formatTokens(limits.tokensPerDay)}
              </span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-700"
              role="progressbar"
              aria-valuenow={tokenPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Token usage"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  tokenPercent > 80
                    ? "bg-error"
                    : tokenPercent > 50
                      ? "bg-warning"
                      : "bg-brand-500"
                )}
                style={{ width: `${tokenPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
