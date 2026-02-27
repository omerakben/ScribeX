"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, BotMessageSquare, PenSquare, Rocket } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const steps = [
  {
    id: "01",
    title: "Frame the manuscript",
    icon: PenSquare,
    detail:
      "Pick a template, set citation style, and establish the argument scope with field and target-journal context.",
    bullet: "Structured paper setup in under a minute",
  },
  {
    id: "02",
    title: "Co-write with Mercury",
    icon: BotMessageSquare,
    detail:
      "Generate section drafts with mercury-2, then apply deterministic rewrites with mercury-edit without losing local voice.",
    bullet: "Dual-model routing by task complexity",
  },
  {
    id: "03",
    title: "Review and publish",
    icon: Rocket,
    detail:
      "Run section-level feedback, tighten citations, and export a submission-ready artifact with contribution traceability.",
    bullet: "Disclosure-ready output pipeline",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" ref={ref} className="py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-mercury-700">Workflow Design</p>
          <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-ink-950 sm:text-5xl">
            A research-native loop from blank page to final submission
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-600">
            The product flow matches real academic behavior: rapid ideation, targeted revision, and explicit quality
            checks before publication.
          </p>
        </motion.div>

        <div className="relative mt-14 grid gap-6 lg:grid-cols-3">
          <div className="pointer-events-none absolute left-8 right-8 top-11 hidden h-px bg-gradient-to-r from-brand-300/10 via-brand-300/60 to-mercury-400/10 lg:block" />

          {steps.map((step, index) => (
            <motion.article
              key={step.id}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: index * 0.12 }}
              className="relative rounded-2xl border border-ink-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold tracking-[0.12em] text-ink-500">STEP {step.id}</span>
                <div
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-xl border",
                    index === 1
                      ? "border-mercury-300 bg-mercury-50 text-mercury-700"
                      : "border-brand-200 bg-brand-50 text-brand-700"
                  )}
                >
                  <step.icon className="h-5 w-5" />
                </div>
              </div>

              <h3 className="mt-6 text-xl font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">{step.detail}</p>

              <div className="mt-5 flex items-center gap-2 rounded-xl border border-ink-200 bg-surface-secondary px-3 py-2 text-xs font-medium text-ink-600">
                <ArrowRight className="h-3.5 w-3.5 text-mercury-600" />
                {step.bullet}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
