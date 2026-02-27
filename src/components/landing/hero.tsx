"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BookMarked,
  Brain,
  CheckCircle2,
  CircleDashed,
  Gauge,
  Play,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const HEADLINE = "Write journal-ready papers at the speed of thought.";
const NOISE = "░▒▓▓▒░";

const statCards = [
  {
    label: "Generation throughput",
    value: "1,000+ tok/s",
    note: "Parallel diffusion decoding",
  },
  {
    label: "Context memory",
    value: "128K",
    note: "Whole-manuscript awareness",
  },
  {
    label: "Inline edit latency",
    value: "Sub-second",
    note: "Powered by mercury-edit",
  },
];

function DiffusionHeadline() {
  const [phase, setPhase] = useState<"noise" | "resolving" | "clear">("noise");
  const [output, setOutput] = useState(HEADLINE);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let raf = 0;
    const startAt = performance.now();
    const duration = 1700;

    const animate = (now: number) => {
      const progress = Math.min((now - startAt) / duration, 1);
      setPhase(progress > 0.07 ? "resolving" : "noise");

      const resolved = HEADLINE.split("").map((char, index) => {
        if (char === " ") return " ";
        const threshold = (index / HEADLINE.length) * 0.92;
        if (progress > threshold + 0.12) return char;
        if (progress > threshold) return Math.random() > 0.42 ? char : NOISE[index % NOISE.length];
        return NOISE[index % NOISE.length];
      });

      setOutput(resolved.join(""));

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setPhase("clear");
        setOutput(HEADLINE);
      }
    };

    const timeout = window.setTimeout(() => {
      raf = requestAnimationFrame(animate);
    }, 140);

    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [isInView]);

  return (
    <div ref={containerRef} className="space-y-6">
      <h1
        className={cn(
          "font-serif text-4xl font-semibold leading-[1.03] tracking-tight text-ink-950 sm:text-5xl lg:text-7xl",
          phase !== "clear" && "select-none"
        )}
      >
        {output}
      </h1>

      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={phase === "clear" ? { width: "68%", opacity: 1 } : { width: 0, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-1 rounded-full bg-gradient-to-r from-mercury-500 via-brand-500 to-mercury-400"
      />
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-20 sm:pt-44 sm:pb-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[14%] top-[16%] h-80 w-80 rounded-full bg-brand-300/30 blur-3xl" />
        <div className="absolute right-[8%] top-[8%] h-72 w-72 rounded-full bg-mercury-300/30 blur-3xl" />
        <div className="absolute inset-x-0 top-[42%] h-[1px] bg-gradient-to-r from-transparent via-ink-300/30 to-transparent" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-16 px-6 lg:grid-cols-[1.03fr_0.97fr] lg:px-8">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 rounded-full border border-brand-200/70 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Diffusion-native research writing
          </motion.div>

          <div className="mt-8">
            <DiffusionHeadline />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-600 sm:text-xl"
          >
            ScribeX pairs <strong className="text-ink-900">mercury-2</strong> for reasoning and generation with
            <strong className="text-ink-900"> mercury-edit</strong> for surgical revision. Build arguments quickly,
            enforce academic rigor, and keep the full manuscript in scope at every step.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.35 }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <Link href="/dashboard">
              <Button size="lg" variant="mercury" className="w-full gap-2 sm:w-auto">
                Launch Workspace
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#speed">
              <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto">
                <Play className="h-4 w-4" />
                See Performance
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-10 grid gap-3 sm:grid-cols-3"
          >
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-ink-200/80 bg-white/90 p-4 shadow-sm backdrop-blur"
              >
                <p className="text-[11px] uppercase tracking-[0.1em] text-ink-500">{stat.label}</p>
                <p className="mt-2 text-lg font-semibold text-ink-900">{stat.value}</p>
                <p className="mt-1 text-xs text-ink-500">{stat.note}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -inset-2 -z-10 rounded-[30px] bg-gradient-to-br from-brand-500/20 via-transparent to-mercury-500/25 blur-2xl" />
          <div className="rounded-[28px] border border-ink-200/80 bg-white/88 p-5 shadow-xl backdrop-blur-xl">
            <div className="rounded-2xl border border-ink-200/90 bg-surface-elevated p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">Live Mercury Session</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-mercury-100 px-2 py-1 text-[11px] font-semibold text-mercury-700">
                  <CircleDashed className="h-3 w-3" />
                  Streaming
                </span>
              </div>

              <div className="mt-5 space-y-3 rounded-xl border border-ink-200 bg-surface-secondary p-4">
                <div className="flex items-start gap-3">
                  <BookMarked className="mt-0.5 h-4 w-4 text-brand-600" />
                  <p className="text-sm leading-relaxed text-ink-700">
                    &ldquo;Generate a comparative synthesis of adaptive governance frameworks in climate policy
                    literature.&rdquo;
                  </p>
                </div>

                <div className="rounded-lg border border-mercury-200/70 bg-mercury-50/70 p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-mercury-800">Mercury output</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-mercury-900">
                    &ldquo;Across 47 studies, adaptive governance effectiveness depends on institutional feedback
                    loops, polycentric authority, and transparent revision cycles...&rdquo;
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-ink-200 bg-surface p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-ink-500">Model route</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-brand-600" />
                    <p className="text-sm font-semibold text-ink-900">mercury-2</p>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">Long-context generation and reasoning</p>
                </div>

                <div className="rounded-xl border border-ink-200 bg-surface p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-ink-500">Edit pass</p>
                  <div className="mt-2 flex items-center gap-2">
                    <WandSparkles className="h-4 w-4 text-mercury-600" />
                    <p className="text-sm font-semibold text-ink-900">mercury-edit</p>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">Apply-edit for surgical inline rewrite</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl border border-ink-200 bg-surface px-4 py-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-ink-500">Throughput snapshot</p>
                  <p className="text-sm font-semibold text-ink-900">1,009 tokens/sec benchmark</p>
                </div>
                <Gauge className="h-5 w-5 text-mercury-600" />
              </div>

              <p className="mt-4 flex items-center gap-2 text-xs text-ink-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-mercury-600" />
                Full-paper context loaded. AI contribution tracking enabled.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
