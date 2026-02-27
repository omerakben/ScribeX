"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Atom,
  BadgeCheck,
  Blocks,
  Bot,
  ChartNetwork,
  FileCheck,
  Microscope,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const features = [
  {
    icon: Atom,
    title: "Diffusion-speed drafting",
    body: "Generate dense academic prose at interactive speed so your analysis loop stays uninterrupted.",
    accent: "mercury" as const,
  },
  {
    icon: Blocks,
    title: "128K whole-paper memory",
    body: "Keep introduction, methods, results, and discussion in one context to maintain coherent terminology.",
    accent: "brand" as const,
  },
  {
    icon: Bot,
    title: "Dual-model routing",
    body: "mercury-2 handles synthesis and reasoning; mercury-edit handles deterministic inline refinement.",
    accent: "mercury" as const,
  },
  {
    icon: ChartNetwork,
    title: "Argument structure feedback",
    body: "Review sections for claim-evidence balance and logical progression before submission.",
    accent: "brand" as const,
  },
  {
    icon: Microscope,
    title: "Citation intelligence",
    body: "Search and insert relevant literature directly in the writing surface with verifiable attribution.",
    accent: "mercury" as const,
  },
  {
    icon: FileCheck,
    title: "AI contribution log",
    body: "Track generated and edited spans for journal policy compliance and transparent disclosure.",
    accent: "brand" as const,
  },
];

const quickFacts = [
  ["Model endpoints", "/v1/chat, /v1/apply, /v1/fim"],
  ["Primary writing modes", "Compose, Quick Edit, Review"],
  ["Citation source", "Semantic Scholar API"],
  ["Output formats", "DOCX, PDF, LaTeX, Markdown"],
];

function FeatureCard({
  title,
  body,
  icon: Icon,
  accent,
  index,
}: {
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "mercury" | "brand";
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className={cn(
        "group relative h-full rounded-2xl border p-5 shadow-sm transition duration-300",
        accent === "mercury"
          ? "border-mercury-200/60 bg-white hover:-translate-y-0.5 hover:border-mercury-300 hover:shadow-glow"
          : "border-brand-200/60 bg-white hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-glow-brand"
      )}
    >
      <div
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg border",
          accent === "mercury"
            ? "border-mercury-200 bg-mercury-50 text-mercury-700"
            : "border-brand-200 bg-brand-50 text-brand-700"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">{body}</p>
    </motion.article>
  );
}

export function FeaturesGrid() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" ref={ref} className="py-24 sm:py-32">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45 }}
            className="max-w-2xl"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
              Core Capabilities
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-ink-950 sm:text-5xl">
              Built for high-stakes research writing, not generic text generation
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-600">
              Every interaction is engineered around the academic workflow: framing an argument, grounding it with
              evidence, revising with precision, and preserving authorship transparency.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>

        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-fit rounded-[26px] border border-ink-200 bg-white/92 p-6 shadow-lg backdrop-blur-xl"
        >
          <div className="rounded-2xl border border-ink-200 bg-surface-secondary p-5">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-mercury-600" />
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-ink-600">Academic Safety Rail</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-700">
              ScribeX enforces citation caution, transparent AI attribution, and style-consistent drafting across the
              full manuscript lifecycle.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-ink-200 bg-surface p-5">
            <p className="text-sm font-semibold text-ink-900">Implementation snapshot</p>
            <div className="mt-4 space-y-3">
              {quickFacts.map(([key, value]) => (
                <div key={key} className="grid grid-cols-[0.9fr_1.1fr] gap-3 border-b border-ink-200 pb-3 last:border-b-0 last:pb-0">
                  <p className="text-xs uppercase tracking-[0.1em] text-ink-500">{key}</p>
                  <p className="text-sm font-medium text-ink-800">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-mercury-200 bg-gradient-to-r from-mercury-50 to-brand-50 p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-mercury-800">Positioning</p>
            <p className="mt-2 text-sm font-semibold text-ink-900">
              &ldquo;Draft broad, refine surgically&rdquo; is the core product behavior surfaced directly in the UI.
            </p>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
