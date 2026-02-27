"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Gauge, TimerReset, Workflow, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function Counter({ target, suffix, duration = 1500 }: { target: number; suffix?: string; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

function BenchRow({
  label,
  speed,
  max,
  primary,
  delay,
}: {
  label: string;
  speed: number;
  max: number;
  primary?: boolean;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-70px" });
  const pct = Math.min((speed / max) * 100, 100);

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <p className={cn("text-sm", primary ? "font-semibold text-ink-100" : "text-ink-400")}>{label}</p>
        <p className={cn("font-mono text-2xl font-semibold tabular-nums", primary ? "text-mercury-300" : "text-ink-300")}>
          {inView ? <Counter target={speed} suffix=" tok/s" duration={1400 + (delay ?? 0)} /> : "0 tok/s"}
        </p>
      </div>

      <div className="h-3 rounded-full bg-white/12">
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : { width: 0 }}
          transition={{ duration: 1, delay: (delay ?? 0) / 1000 }}
          className={cn(
            "h-full rounded-full",
            primary
              ? "bg-gradient-to-r from-mercury-400 to-mercury-300 shadow-[0_0_18px_rgba(61,226,188,0.35)]"
              : "bg-ink-300/60"
          )}
        />
      </div>
    </div>
  );
}

const statCards = [
  {
    icon: Zap,
    value: 1009,
    suffix: "+",
    title: "Peak generation throughput",
    detail: "Parallel diffusion decoding benchmark",
  },
  {
    icon: TimerReset,
    value: 1700,
    suffix: "ms",
    title: "End-to-end latency",
    detail: "Typical response loop for drafting tasks",
  },
  {
    icon: Workflow,
    value: 128,
    suffix: "K",
    title: "Context window",
    detail: "Whole-document conditioning",
  },
];

export function SpeedComparison() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="speed" ref={ref} className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-ink-950" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[16%] top-[18%] h-72 w-72 rounded-full bg-mercury-500/16 blur-3xl" />
        <div className="absolute right-[12%] top-[26%] h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 lg:grid-cols-[0.98fr_1.02fr] lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-mercury-500/30 bg-mercury-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-mercury-200">
            <Gauge className="h-3.5 w-3.5" />
            Live benchmark profile
          </p>

          <h2 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Throughput that keeps up with academic iteration
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-300">
            The interface is tuned for fast loops: generate, inspect, revise, and continue without waiting for a
            token-by-token stream to complete.
          </p>

          <div className="mt-10 space-y-5 rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-sm">
            <BenchRow label="Mercury 2 (ScribeX)" speed={1009} max={1100} primary />
            <BenchRow label="GPT-4o" speed={110} max={1100} delay={150} />
            <BenchRow label="Claude 3.5 Sonnet" speed={90} max={1100} delay={300} />
            <BenchRow label="Gemini 1.5 Pro" speed={85} max={1100} delay={450} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="space-y-4"
        >
          {statCards.map((stat, index) => (
            <div
              key={stat.title}
              className="rounded-2xl border border-white/14 bg-white/[0.05] p-5 shadow-xl backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{stat.title}</p>
                <stat.icon className="h-5 w-5 text-mercury-300" />
              </div>
              <p className="mt-3 font-mono text-4xl font-semibold text-mercury-200 tabular-nums">
                {inView ? <Counter target={stat.value} suffix={stat.suffix} duration={1650 + index * 120} /> : `0${stat.suffix}`}
              </p>
              <p className="mt-2 text-sm text-ink-300">{stat.detail}</p>
            </div>
          ))}

          <div className="rounded-2xl border border-mercury-500/35 bg-mercury-500/12 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mercury-200">UX implication</p>
            <p className="mt-2 text-sm leading-relaxed text-mercury-100">
              No blocking spinner walls. ScribeX prioritizes immediate insertion and incremental refinement to protect
              researcher flow-state.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
