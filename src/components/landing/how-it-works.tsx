"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { PenLine, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const steps = [
  {
    number: "01",
    icon: PenLine,
    title: "Write",
    description:
      "Start with any template — IMRAD, literature review, thesis chapter — or a blank page. Write naturally with smart autocomplete guiding your flow.",
    visual: "Draft your ideas",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Mercury Refines",
    description:
      "Mercury's dual-model architecture kicks in. Use slash commands to generate, expand, simplify, or find citations. Mercury Edit handles surgical revisions in-place.",
    visual: "AI-powered refinement",
  },
  {
    number: "03",
    icon: Send,
    title: "Publish",
    description:
      "Export publication-ready manuscripts with proper formatting, verified citations, and full AI contribution tracking for journal compliance.",
    visual: "Publication-ready output",
  },
];

function StepCard({
  step,
  index,
  isLast,
}: {
  step: (typeof steps)[number];
  index: number;
  isLast: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      className="relative flex flex-col items-center text-center"
    >
      {/* Connector line (not on last) */}
      {!isLast && (
        <div className="pointer-events-none absolute left-1/2 top-10 hidden h-px w-full translate-x-[50%] lg:block">
          <motion.div
            className="h-px w-full bg-gradient-to-r from-mercury-400/60 to-mercury-400/0"
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, delay: index * 0.2 + 0.3 }}
            style={{ transformOrigin: "left" }}
          />
        </div>
      )}

      {/* Step number + icon circle */}
      <div className="relative mb-6">
        <div
          className={cn(
            "flex h-20 w-20 items-center justify-center rounded-2xl border-2",
            index === 1
              ? "border-mercury-400 bg-mercury-50 shadow-glow dark:border-mercury-600 dark:bg-mercury-900/30"
              : "border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-800"
          )}
        >
          <step.icon
            size={28}
            className={cn(
              index === 1
                ? "text-mercury-600 dark:text-mercury-400"
                : "text-brand-600 dark:text-brand-400"
            )}
          />
        </div>
        <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {step.number}
        </span>
      </div>

      <h3 className="font-serif text-2xl font-bold text-ink-900 dark:text-ink-100">
        {step.title}
      </h3>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-600 dark:text-ink-400">
        {step.description}
      </p>
    </motion.div>
  );
}

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="bg-white py-24 dark:bg-ink-900 sm:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="font-serif text-4xl font-bold tracking-tight text-ink-900 dark:text-ink-50 sm:text-5xl">
            From draft to publication
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-600 dark:text-ink-400">
            A streamlined workflow powered by Mercury&apos;s dual-model
            architecture — reasoning for generation, editing for refinement.
          </p>
        </motion.div>

        <div className="mt-20 grid grid-cols-1 gap-16 lg:grid-cols-3 lg:gap-8">
          {steps.map((step, i) => (
            <StepCard
              key={step.title}
              step={step}
              index={i}
              isLast={i === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
