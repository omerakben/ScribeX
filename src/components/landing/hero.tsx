"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Play, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/* ─── Diffusion Text Effect ─────────────────────────────────── */

const DIFFUSION_TEXT = "Write academic papers at the speed of thought.";
const NOISE_CHARS = "abcdefghijklmnopqrstuvwxyz      ";

function DiffusionVisualization() {
  const [phase, setPhase] = useState<"noise" | "resolving" | "clear">("noise");
  const [displayText, setDisplayText] = useState("");
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const RESOLVE_DURATION = 1800;
    startTimeRef.current = Date.now();
    setPhase("resolving");

    function animate() {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / RESOLVE_DURATION, 1);

      // Characters resolve left-to-right with some randomness
      const resolved = DIFFUSION_TEXT.split("").map((char, i) => {
        const charThreshold = (i / DIFFUSION_TEXT.length) * 0.85;
        if (progress > charThreshold + 0.15) return char;
        if (progress > charThreshold) {
          // Transitioning - sometimes show correct char, sometimes noise
          return Math.random() > 0.4
            ? char
            : NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)];
        }
        return NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)];
      });

      setDisplayText(resolved.join(""));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayText(DIFFUSION_TEXT);
        setPhase("clear");
      }
    }

    // Brief pause then start resolving
    const timeout = setTimeout(() => {
      frameRef.current = requestAnimationFrame(animate);
    }, 400);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frameRef.current);
    };
  }, [isInView]);

  return (
    <div ref={containerRef} className="relative">
      <h1
        className={cn(
          "font-serif text-5xl font-bold leading-[1.15] tracking-tight text-ink-900 dark:text-ink-50 sm:text-6xl lg:text-7xl",
          phase === "resolving" && "select-none"
        )}
        aria-label={DIFFUSION_TEXT}
      >
        <span
          className={cn(
            "inline-block transition-[filter] duration-500",
            phase === "noise" && "blur-[8px] opacity-30",
            phase === "resolving" && "blur-0 opacity-100",
            phase === "clear" && "blur-0 opacity-100"
          )}
        >
          {displayText || DIFFUSION_TEXT}
        </span>
      </h1>
      {/* Mercury glow underline */}
      <motion.div
        className="mt-3 h-1 rounded-full bg-gradient-to-r from-mercury-400 via-mercury-500 to-mercury-300"
        initial={{ width: 0, opacity: 0 }}
        animate={
          phase === "clear"
            ? { width: "60%", opacity: 1 }
            : { width: 0, opacity: 0 }
        }
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

/* ─── Speed Badge ────────────────────────────────────────────── */

function SpeedBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="inline-flex items-center gap-2 rounded-full border border-mercury-300/40 bg-mercury-50 px-4 py-1.5 dark:border-mercury-700/40 dark:bg-mercury-900/20"
    >
      <Zap size={14} className="text-mercury-600" />
      <span className="text-sm font-medium text-mercury-700 dark:text-mercury-400">
        Powered by Mercury dLLM — 1,000+ tokens/sec
      </span>
    </motion.div>
  );
}

/* ─── Hero Section ───────────────────────────────────────────── */

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-gradient-to-b from-brand-100/60 via-mercury-100/30 to-transparent blur-3xl dark:from-brand-950/40 dark:via-mercury-900/20 dark:to-transparent" />
        <div className="absolute right-0 top-1/3 h-[300px] w-[300px] rounded-full bg-mercury-200/20 blur-3xl dark:bg-mercury-800/10" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <SpeedBadge />

          <div className="mt-8">
            <DiffusionVisualization />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8 text-lg leading-relaxed text-ink-600 dark:text-ink-400 sm:text-xl"
          >
            The first academic writing assistant powered by{" "}
            <strong className="text-ink-800 dark:text-ink-200">
              Mercury diffusion language models
            </strong>
            . Sub-second responses. Full-paper awareness. 128K context that
            understands your entire manuscript.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link href="/dashboard">
              <Button variant="mercury" size="lg" className="gap-2">
                Start Writing Free
                <ArrowRight size={18} />
              </Button>
            </Link>
            <a href="#speed">
              <Button variant="outline" size="lg" className="gap-2">
                <Play size={16} />
                Watch Demo
              </Button>
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="mt-8 text-sm text-ink-500 dark:text-ink-500"
          >
            Trusted by researchers at leading universities worldwide
          </motion.p>
        </div>
      </div>
    </section>
  );
}
