"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FileText, BrainCircuit, Download } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Set up your paper",
    description:
      "Choose a template, set your citation style, and define your paper's structure.",
  },
  {
    number: "02",
    icon: BrainCircuit,
    title: "Write with AI",
    description:
      "Draft sections with AI assistance, get inline suggestions, and expand your arguments.",
  },
  {
    number: "03",
    icon: Download,
    title: "Review and export",
    description:
      "Run a full manuscript review, refine citations, and export to PDF or DOCX.",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" ref={ref} className="bg-white py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600">
            How It Works
          </p>
          <h2 className="font-serif text-3xl font-semibold text-ink-950 md:text-4xl lg:text-5xl">
            From blank page to submission
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-500">
            Three steps to a polished manuscript.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative mt-20">
          {/* Connecting line — desktop only */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-10 hidden h-px md:block"
            style={{
              background:
                "linear-gradient(to right, transparent 0%, var(--color-brand-200) 15%, var(--color-brand-200) 85%, transparent 100%)",
            }}
          />

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.article
                key={step.number}
                initial={{ opacity: 0, y: 28 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.14 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Step circle */}
                <div className="relative mb-8 flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand-200 bg-white shadow-sm">
                  {/* Step number inside */}
                  <step.icon className="h-7 w-7 text-brand-600" />
                  {/* Small number badge */}
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow">
                    {step.number.replace("0", "")}
                  </span>
                </div>

                <div className="rounded-2xl border border-ink-100 bg-ink-50/50 p-7 w-full transition-all duration-200 hover:border-brand-200 hover:shadow-sm">
                  <h3 className="text-lg font-semibold text-ink-900">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-500">
                    {step.description}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
