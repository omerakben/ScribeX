"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { PLAN_LIMITS } from "@/lib/constants";

interface PricingTier {
  name: string;
  plan: keyof typeof PLAN_LIMITS;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: "Scholar",
    plan: "scholar",
    price: "Free",
    period: "",
    description: "Perfect for exploring ScribeX on a single project.",
    features: [
      "50K tokens/day",
      "Up to 3 papers",
      "Smart autocomplete",
      "Basic citation search",
      "AI contribution tracking",
    ],
    cta: "Get Started Free",
  },
  {
    name: "Researcher",
    plan: "researcher",
    price: "$19",
    period: "/month",
    description: "For individual researchers with active writing workflows.",
    features: [
      "500K tokens/day",
      "Unlimited papers",
      "Mercury Edit (inline revisions)",
      "Full citation intelligence",
      "All slash commands",
      "Priority response times",
    ],
    cta: "Start 14-Day Trial",
    popular: true,
  },
  {
    name: "Lab",
    plan: "lab",
    price: "$39",
    period: "/month",
    description: "For research groups that collaborate on manuscripts.",
    features: [
      "2M tokens/day",
      "Unlimited papers",
      "Real-time collaboration",
      "Shared citation library",
      "Lab-wide style guide",
      "Admin dashboard",
      "Priority support",
    ],
    cta: "Start Lab Trial",
  },
  {
    name: "Institution",
    plan: "institution",
    price: "Custom",
    period: "",
    description: "For universities and research institutions at scale.",
    features: [
      "Unlimited tokens",
      "Unlimited papers",
      "SSO / SAML integration",
      "Custom LLM deployment",
      "Dedicated account manager",
      "SLA guarantee",
      "Volume licensing",
    ],
    cta: "Contact Sales",
  },
];

function PricingCard({
  tier,
  index,
}: {
  tier: PricingTier;
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
        "relative flex flex-col rounded-xl border p-6",
        tier.popular
          ? "border-mercury-400 bg-white shadow-lg shadow-mercury-200/20 dark:border-mercury-600 dark:bg-ink-900 dark:shadow-mercury-800/10"
          : "border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900"
      )}
    >
      {/* Popular badge */}
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mercury-600 px-3 py-1 text-xs font-semibold text-white shadow-glow">
            <Sparkles size={12} />
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-sans text-lg font-semibold text-ink-900 dark:text-ink-100">
          {tier.name}
        </h3>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="font-serif text-4xl font-bold text-ink-900 dark:text-ink-50">
            {tier.price}
          </span>
          {tier.period && (
            <span className="text-sm text-ink-500">{tier.period}</span>
          )}
        </div>
        <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
          {tier.description}
        </p>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {tier.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2.5 text-sm text-ink-700 dark:text-ink-300"
          >
            <Check
              size={16}
              className={cn(
                "mt-0.5 shrink-0",
                tier.popular
                  ? "text-mercury-500"
                  : "text-brand-500"
              )}
            />
            {feature}
          </li>
        ))}
      </ul>

      <Link href={tier.plan === "institution" ? "#" : "/dashboard"}>
        <Button
          variant={tier.popular ? "mercury" : "outline"}
          size="lg"
          className="w-full"
        >
          {tier.cta}
        </Button>
      </Link>
    </motion.div>
  );
}

export function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="pricing"
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
            Start writing for free
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-600 dark:text-ink-400">
            No credit card required. Upgrade when Mercury becomes
            indispensable.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier, i) => (
            <PricingCard key={tier.name} tier={tier} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
