"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Zap, Timer, Gauge } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ─── Animated Counter ───────────────────────────────────────── */

function AnimatedCounter({
  target,
  suffix = "",
  duration = 2000,
  className,
}: {
  target: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView) return;

    const start = Date.now();
    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, target, duration]);

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─── Speed Bar ──────────────────────────────────────────────── */

interface SpeedBarProps {
  label: string;
  speed: number;
  maxSpeed: number;
  color: "mercury" | "neutral";
  delay?: number;
}

function SpeedBar({ label, speed, maxSpeed, color, delay = 0 }: SpeedBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const pct = (speed / maxSpeed) * 100;

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex items-end justify-between">
        <span className="text-sm font-medium text-ink-700 dark:text-ink-300">
          {label}
        </span>
        <span
          className={cn(
            "font-mono text-2xl font-bold tabular-nums",
            color === "mercury"
              ? "text-mercury-600 dark:text-mercury-400"
              : "text-ink-500 dark:text-ink-500"
          )}
        >
          {inView ? (
            <AnimatedCounter
              target={speed}
              suffix=" tok/s"
              duration={1600 + delay}
            />
          ) : (
            <>0 tok/s</>
          )}
        </span>
      </div>
      <div className="h-4 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <motion.div
          className={cn(
            "h-full rounded-full",
            color === "mercury"
              ? "bg-gradient-to-r from-mercury-500 to-mercury-400 shadow-[0_0_12px_rgba(32,201,151,0.4)]"
              : "bg-ink-400 dark:bg-ink-600"
          )}
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : { width: 0 }}
          transition={{
            duration: 1.2,
            delay: delay / 1000,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        />
      </div>
    </div>
  );
}

/* ─── Speed Comparison Section ───────────────────────────────── */

export function SpeedComparison() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="speed"
      ref={sectionRef}
      className="relative bg-ink-950 py-24 text-white sm:py-32"
    >
      {/* Glow accent */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-mercury-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-mercury-600/30 bg-mercury-900/30 px-4 py-1.5">
            <Zap size={14} className="text-mercury-400" />
            <span className="text-sm font-medium text-mercury-300">
              10x Faster Than GPT
            </span>
          </div>

          <h2 className="mt-6 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Speed that changes everything
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-400">
            Mercury&apos;s diffusion architecture generates all tokens in
            parallel, not one at a time. The result? Writing assistance that
            feels instantaneous.
          </p>
        </motion.div>

        {/* Bar chart comparison */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-16 max-w-2xl space-y-8"
        >
          <SpeedBar
            label="Mercury dLLM (ScribeX)"
            speed={1050}
            maxSpeed={1100}
            color="mercury"
            delay={0}
          />
          <SpeedBar
            label="GPT-4o"
            speed={110}
            maxSpeed={1100}
            color="neutral"
            delay={200}
          />
          <SpeedBar
            label="Claude 3.5 Sonnet"
            speed={90}
            maxSpeed={1100}
            color="neutral"
            delay={400}
          />
          <SpeedBar
            label="Gemini 1.5 Pro"
            speed={85}
            maxSpeed={1100}
            color="neutral"
            delay={600}
          />
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mx-auto mt-20 grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3"
        >
          {[
            {
              icon: Zap,
              value: 1050,
              suffix: "+",
              label: "Tokens per second",
            },
            {
              icon: Timer,
              value: 200,
              suffix: "ms",
              label: "Average response time",
            },
            {
              icon: Gauge,
              value: 128,
              suffix: "K",
              label: "Context window (tokens)",
            },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon
                size={20}
                className="mx-auto mb-3 text-mercury-400"
              />
              <div className="font-mono text-3xl font-bold text-white">
                {inView ? (
                  <AnimatedCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    duration={1800}
                  />
                ) : (
                  <>
                    0{stat.suffix}
                  </>
                )}
              </div>
              <div className="mt-1 text-sm text-ink-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
