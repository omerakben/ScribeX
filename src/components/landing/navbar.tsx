"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#how-it-works" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 backdrop-blur-sm transition-all duration-300",
        scrolled
          ? "border-b border-ink-100 bg-white/95 shadow-sm"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <span
            className={cn(
              "font-serif text-xl font-semibold transition-colors duration-300",
              scrolled ? "text-ink-950" : "text-white"
            )}
          >
            ScribeX
          </span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  scrolled
                    ? "text-ink-600 hover:text-ink-900"
                    : "text-brand-200 hover:text-white"
                )}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center lg:flex">
          <Link href="/dashboard">
            <span
              className={cn(
                "cursor-pointer rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200",
                scrolled
                  ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
                  : "bg-white text-brand-950 shadow-md hover:bg-brand-50"
              )}
            >
              Start Writing
            </span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className={cn(
            "rounded-lg p-2 transition-colors duration-150 lg:hidden",
            scrolled
              ? "text-ink-700 hover:bg-ink-100"
              : "text-white hover:bg-brand-800/50"
          )}
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
            className="overflow-hidden border-t border-ink-100 bg-white px-6 py-5 lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition-colors duration-150 hover:bg-ink-50 hover:text-ink-900"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-4 border-t border-ink-100 pt-4">
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <span className="block w-full rounded-lg bg-brand-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-700">
                    Start Writing
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
