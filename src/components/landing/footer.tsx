import Link from "next/link";

const columns = {
  Product: [
    { label: "Capabilities", href: "#features" },
    { label: "Benchmarks", href: "#speed" },
    { label: "Workflow", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ],
  Research: [
    { label: "Citation engine", href: "#" },
    { label: "Template library", href: "/dashboard/templates" },
    { label: "Review workspace", href: "/dashboard" },
    { label: "Editorial policies", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Changelog", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Status", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-surface-secondary/80">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-brand-300/60 bg-brand-600 text-white">
                <span className="font-serif text-lg font-semibold">S</span>
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-mercury-300" />
              </div>
              <div>
                <p className="font-serif text-2xl font-semibold tracking-tight text-ink-950">ScribeX</p>
                <p className="text-xs uppercase tracking-[0.14em] text-ink-500">Mercury-powered writing</p>
              </div>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-600">
              Academic interface for rapid drafting, argument refinement, and compliant AI-assisted publishing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {Object.entries(columns).map(([heading, links]) => (
              <div key={heading}>
                <p className="text-sm font-semibold text-ink-900">{heading}</p>
                <ul className="mt-4 space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-ink-600 transition-colors hover:text-ink-900"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-ink-200 pt-7 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} ScribeX. All rights reserved.</p>
          <p>
            Built on <span className="font-semibold text-mercury-700">mercury-2</span> and
            <span className="font-semibold text-mercury-700"> mercury-edit</span> from Inception Labs.
          </p>
        </div>
      </div>
    </footer>
  );
}
