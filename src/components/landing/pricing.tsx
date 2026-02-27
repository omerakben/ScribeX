"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Globe, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const highlights = [
  "AI-powered academic writing",
  "Mercury diffusion models",
  "Integrated citation search",
  "Multiple writing modes",
];

export function Pricing() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="contact" ref={ref} className="bg-ink-50/70 py-28">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600">
            Get in touch
          </p>
          <h2 className="font-serif text-3xl font-semibold text-ink-950 md:text-4xl lg:text-5xl">
            Interested in ScribeX?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-500">
            ScribeX is a unique project by{" "}
            <a
              href="https://tuel.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-600 underline decoration-brand-300 underline-offset-2 transition-colors hover:text-brand-700"
            >
              TUEL AI
            </a>
            . If you&apos;re interested in learning more, collaborating, or
            exploring what ScribeX can do for your research workflow — we&apos;d
            love to hear from you.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.12 }}
          className="mx-auto mt-14 max-w-2xl rounded-2xl border-2 border-brand-600 bg-brand-950 p-10 text-center shadow-xl shadow-brand-900/30"
        >
          {/* TUEL AI header — centered */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10b981]/20">
              <Sparkles className="h-6 w-6 text-[#10b981]" />
            </div>
            <div>
              <p className="text-xl font-semibold text-white">TUEL AI</p>
              <p className="text-sm text-brand-300/70">
                AI Engineering &amp; Solutions
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-auto my-7 h-px w-full max-w-xs bg-brand-800" />

          {/* Highlights — centered grid */}
          <ul className="mx-auto grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
            {highlights.map((item) => (
              <li
                key={item}
                className="flex items-center justify-center gap-2.5 sm:justify-start"
              >
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#10b981]/20">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                </div>
                <span className="text-sm text-brand-100/80">{item}</span>
              </li>
            ))}
          </ul>

          {/* CTAs — centered */}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://tuel.ai/#contact"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3",
                "text-sm font-semibold text-white shadow-lg transition-all duration-150"
              )}
              style={{
                backgroundColor: "#10b981",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#059669")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#10b981")
              }
            >
              Reach out
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="https://tuel.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl border border-brand-700 px-7 py-3",
                "text-sm font-semibold text-brand-200 transition-all duration-150",
                "hover:border-[#10b981]/50 hover:text-white"
              )}
            >
              <Globe className="h-4 w-4" />
              Visit tuel.ai
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
