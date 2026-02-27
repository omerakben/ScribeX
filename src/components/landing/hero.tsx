"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-950">
      {/* Decorative orb — top right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-48 -top-48 h-[720px] w-[720px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, oklch(53.8% 0.148 252 / 0.22) 0%, transparent 65%)",
        }}
      />
      {/* Decorative orb — bottom left */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-32 h-[560px] w-[560px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, oklch(53.2% 0.072 195 / 0.18) 0%, transparent 65%)",
        }}
      />
      {/* Dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(100% 0 0 / 0.10) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto w-full max-w-5xl px-6 py-32 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-700/60 bg-brand-900/60 px-4 py-1.5 text-xs font-medium tracking-wide text-brand-300 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            Powered by Mercury Diffusion AI
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-serif text-5xl font-semibold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          Write research papers
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--color-brand-300), var(--color-mercury-300))",
            }}
          >
            with clarity and confidence
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed md:text-xl"
          style={{ color: "oklch(87.4% 0.048 252 / 0.70)" }}
        >
          ScribeX helps researchers draft, revise, and cite with AI assistance
          — from blank page to submission-ready manuscript.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-brand-950 shadow-lg transition-all duration-200 hover:bg-brand-50 hover:shadow-xl"
          >
            Start Writing
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center rounded-xl border border-brand-700/60 bg-brand-900/40 px-8 py-3.5 text-base font-medium text-brand-100 backdrop-blur-sm transition-all duration-200 hover:border-brand-500/80 hover:bg-brand-800/60"
          >
            See How It Works
          </a>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="mt-16 inline-flex flex-wrap justify-center rounded-2xl border border-brand-800/80 bg-brand-900/50 p-2 backdrop-blur-sm"
        >
          {[
            { value: "128K", label: "context window" },
            { value: "< 1s", label: "response time" },
            { value: "10+", label: "writing modes" },
          ].map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              {i > 0 && (
                <div aria-hidden className="mx-1 h-8 w-px bg-brand-800" />
              )}
              <div className="px-6 py-3 text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-0.5 text-xs text-brand-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
