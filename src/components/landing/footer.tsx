import Link from "next/link";

const columns = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Workflow", href: "#how-it-works" },
    { label: "Contact", href: "#contact" },
    { label: "Templates", href: "/dashboard/templates" },
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
    { label: "Contact", href: "https://tuel.ai/#contact" },
    { label: "Status", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-brand-950">
      {/* Subtle gradient orb */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, oklch(44.2% 0.148 252 / 0.15) 0%, transparent 65%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center">
              <span className="font-serif text-xl font-semibold text-white">
                ScribeX
              </span>
            </Link>
            <p className="mt-3 text-sm text-brand-300/60">
              Academic writing, intelligently assisted.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {Object.entries(columns).map(([heading, links]) => (
              <div key={heading}>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                  {heading}
                </p>
                <ul className="mt-4 space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-brand-300/60 transition-colors duration-150 hover:text-brand-200"
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

        <div className="mt-12 border-t border-brand-800/60 pt-7">
          <p className="text-xs text-brand-400/60">&copy; 2026 ScribeX</p>
        </div>
      </div>
    </footer>
  );
}
