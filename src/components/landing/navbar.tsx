"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const navLinks = [
  { label: "Capabilities", href: "#features" },
  { label: "Benchmarks", href: "#speed" },
  { label: "Workflow", href: "#how-it-works" },
  { label: "Plans", href: "#pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-ink-200/70 bg-white/84 shadow-sm backdrop-blur-xl dark:border-ink-700/70 dark:bg-ink-950/82"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl border border-brand-300/60 bg-brand-600 text-white shadow-glow-brand">
            <span className="font-serif text-lg font-semibold">S</span>
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-mercury-300" />
          </div>
          <div>
            <p className="font-serif text-[1.38rem] font-semibold tracking-tight text-ink-950 dark:text-ink-50">
              ScribeX
            </p>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">
              Academic Intelligence
            </p>
          </div>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-semibold text-ink-600 transition-colors hover:text-ink-950 dark:text-ink-300 dark:hover:text-ink-50"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="inline-flex items-center gap-2 rounded-full border border-mercury-300/40 bg-mercury-50/70 px-3 py-1 text-xs font-semibold text-mercury-700 dark:border-mercury-800/70 dark:bg-mercury-900/20 dark:text-mercury-300">
            <Zap className="h-3.5 w-3.5" />
            <span>Mercury 2 + Mercury Edit</span>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              Enter Workspace
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="mercury" size="sm">
              Start Writing
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg p-2 text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800 lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-ink-200 bg-white px-6 py-5 dark:border-ink-700 dark:bg-ink-950 lg:hidden"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-2 py-1.5 text-sm font-semibold text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
                >
                  {link.label}
                </a>
              ))}

              <div className="mt-2 grid gap-2">
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Enter Workspace
                  </Button>
                </Link>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="mercury" className="w-full">
                    Start Writing
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
