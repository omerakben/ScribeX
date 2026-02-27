import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Templates", href: "#" },
    { label: "Changelog", href: "#" },
  ],
  Research: [
    { label: "Citation Search", href: "#" },
    { label: "Academic Templates", href: "#" },
    { label: "Writing Guides", href: "#" },
    { label: "API Docs", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "AI Disclosure Policy", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-5">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                <span className="font-serif text-lg font-bold text-white leading-none">
                  S
                </span>
                <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-mercury-400 shadow-glow" />
              </div>
              <span className="font-serif text-xl font-bold text-ink-900 dark:text-ink-100">
                ScribeX
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500 dark:text-ink-500">
              Academic writing at the speed of thought. Powered by Mercury
              diffusion language models from Inception Labs.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold text-ink-900 dark:text-ink-200">
                {heading}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-ink-500 transition-colors hover:text-ink-800 dark:text-ink-500 dark:hover:text-ink-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-200 pt-8 dark:border-ink-800 sm:flex-row">
          <p className="text-xs text-ink-500">
            &copy; {new Date().getFullYear()} ScribeX. All rights reserved.
          </p>
          <p className="text-xs text-ink-400 dark:text-ink-600">
            Powered by{" "}
            <span className="font-medium text-mercury-600 dark:text-mercury-500">
              Mercury dLLM
            </span>{" "}
            from Inception Labs
          </p>
        </div>
      </div>
    </footer>
  );
}
