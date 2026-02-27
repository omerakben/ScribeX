"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Zap, Pencil, BookMarked } from "lucide-react";

const cards = [
  {
    icon: Zap,
    title: "Draft at speed",
    description:
      "Generate dense academic prose at interactive speed, keeping your analysis loop unbroken.",
  },
  {
    icon: Pencil,
    title: "Revise with precision",
    description:
      "Inline edits that preserve your voice and argument structure, not generic rewrites.",
  },
  {
    icon: BookMarked,
    title: "Cite with confidence",
    description:
      "Search 200M+ papers and insert properly formatted references as you write.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export function SpeedComparison() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="speed" ref={ref} className="relative overflow-hidden bg-brand-950 py-28">
      {/* Background orb */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, oklch(44.2% 0.148 252 / 0.18) 0%, transparent 65%)",
        }}
      />
      {/* Dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(100% 0 0 / 0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="text-center">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-700/60 bg-brand-900/60 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-300">
            Why ScribeX
          </p>
          <h2 className="font-serif text-3xl font-semibold text-white md:text-4xl lg:text-5xl">
            Built for how academics actually write
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg" style={{ color: "oklch(87.4% 0.048 252 / 0.65)" }}>
            ScribeX is designed around the research writing loop — not around
            showcasing AI. Every feature serves the work.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {cards.map((card) => (
            <motion.div
              key={card.title}
              variants={cardVariants}
              className="group relative overflow-hidden rounded-2xl border border-brand-800/80 bg-brand-900/60 p-8 backdrop-blur-sm transition-all duration-300 hover:border-brand-600/60 hover:bg-brand-900/80"
            >
              {/* Hover glow */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, oklch(53.8% 0.148 252 / 0.10) 0%, transparent 60%)",
                }}
              />
              <div className="relative">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-brand-700/60 bg-brand-800/80 transition-all duration-200 group-hover:border-brand-600/80 group-hover:bg-brand-700/60">
                  <card.icon className="h-5 w-5 text-brand-300" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {card.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-brand-300/70">
                  {card.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
