"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Zap,
  BookOpen,
  PenTool,
  Sparkles,
  GraduationCap,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const features = [
  {
    icon: Zap,
    title: "Sub-Second Responses",
    description:
      "Mercury's diffusion architecture generates tokens in parallel. No more watching a cursor crawl across the screen.",
    accent: "mercury" as const,
  },
  {
    icon: BookOpen,
    title: "128K Context — Full-Paper Awareness",
    description:
      "Your entire manuscript in one context window. ScribeX references earlier sections when writing later ones — maintaining consistency throughout.",
    accent: "brand" as const,
  },
  {
    icon: PenTool,
    title: "Mercury Edit — Surgical Inline Edits",
    description:
      "Highlight any passage and get instant, targeted rewrites. Mercury Edit understands the surrounding context to preserve your voice.",
    accent: "mercury" as const,
  },
  {
    icon: Sparkles,
    title: "Smart Autocomplete",
    description:
      "Ghost text suggestions that feel prescient. Trained on millions of academic papers to anticipate your next sentence, not just your next word.",
    accent: "brand" as const,
  },
  {
    icon: GraduationCap,
    title: "Citation Intelligence",
    description:
      "Access 200M+ papers via Semantic Scholar. ScribeX finds relevant citations, verifies them, and formats for your target journal.",
    accent: "mercury" as const,
  },
  {
    icon: FileCheck,
    title: "AI Contribution Tracking",
    description:
      "Every AI-generated or AI-edited passage is tracked with full provenance. Transparent, auditable, and compliant with journal disclosure policies.",
    accent: "brand" as const,
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "group relative rounded-xl border bg-white p-6 transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-0.5",
        "dark:bg-ink-900",
        feature.accent === "mercury"
          ? "border-mercury-200/60 hover:border-mercury-300 hover:shadow-mercury-200/20 dark:border-mercury-800/40 dark:hover:border-mercury-700"
          : "border-ink-200 hover:border-brand-200 hover:shadow-brand-200/20 dark:border-ink-700 dark:hover:border-brand-800"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg",
          feature.accent === "mercury"
            ? "bg-mercury-100 text-mercury-600 dark:bg-mercury-900/40 dark:text-mercury-400"
            : "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400"
        )}
      >
        <feature.icon size={20} />
      </div>

      <h3 className="font-sans text-lg font-semibold text-ink-900 dark:text-ink-100">
        {feature.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-400">
        {feature.description}
      </p>
    </motion.div>
  );
}

export function FeaturesGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="features"
      ref={sectionRef}
      className="bg-surface-secondary py-24 dark:bg-ink-950 sm:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="font-serif text-4xl font-bold tracking-tight text-ink-900 dark:text-ink-50 sm:text-5xl">
            Built for serious research
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-600 dark:text-ink-400">
            Every feature designed for the demands of academic writing —
            precision, rigor, and speed that keeps up with your thinking.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
