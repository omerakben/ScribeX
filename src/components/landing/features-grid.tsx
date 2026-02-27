"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  GitMerge,
  BarChart3,
  Search,
  FileCheck,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Drafting",
    description:
      "Generate well-structured academic prose from outlines, notes, or prompts.",
  },
  {
    icon: BookOpen,
    title: "Full-Document Awareness",
    description:
      "Your entire manuscript stays in context, ensuring consistent terminology and arguments.",
  },
  {
    icon: GitMerge,
    title: "Smart Editing Modes",
    description:
      "Choose between broad rewrites and precise inline edits — the right AI model is selected automatically.",
  },
  {
    icon: BarChart3,
    title: "Argument Analysis",
    description:
      "Get feedback on claim structure, evidence gaps, and logical flow across sections.",
  },
  {
    icon: Search,
    title: "Citation Intelligence",
    description:
      "Search and insert references from Semantic Scholar directly in your writing.",
  },
  {
    icon: FileCheck,
    title: "Contribution Tracking",
    description:
      "Track AI-generated and human-edited spans for journal compliance and transparency.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

function FeatureCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.article
      variants={cardVariants}
      className="group relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-7 shadow-sm transition-all duration-300 hover:border-brand-200 hover:shadow-md"
    >
      {/* Hover gradient fill */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50/0 to-brand-50/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:from-brand-50/60 group-hover:to-mercury-50/30" />

      <div className="relative">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 transition-all duration-200 group-hover:border-brand-200 group-hover:bg-brand-100">
          <Icon className="h-5 w-5 text-brand-600" />
        </div>
        <h3 className="text-base font-semibold text-ink-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          {description}
        </p>
      </div>
    </motion.article>
  );
}

export function FeaturesGrid() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" ref={ref} className="bg-white py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="text-center">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600">
            Capabilities
          </p>
          <h2 className="font-serif text-3xl font-semibold text-ink-950 md:text-4xl lg:text-5xl">
            Everything you need to write and publish
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-500">
            From first draft to final submission, ScribeX supports every stage
            of the academic writing process.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
