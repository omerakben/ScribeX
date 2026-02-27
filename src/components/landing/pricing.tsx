"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Check, Crown, Sparkles, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const tiers = [
  {
    name: "Scholar",
    price: "$0",
    period: "/month",
    subtitle: "For exploratory use",
    features: [
      "50K tokens/day",
      "3 active papers",
      "Slash command drafting",
      "Basic citation lookup",
      "Local document storage",
    ],
    cta: "Start Free",
    href: "/dashboard",
  },
  {
    name: "Researcher",
    price: "$19",
    period: "/month",
    subtitle: "For active publishing",
    features: [
      "500K tokens/day",
      "Unlimited papers",
      "mercury-edit inline rewrites",
      "Full review workspace",
      "Export to DOCX and PDF",
    ],
    cta: "Launch Researcher",
    href: "/dashboard",
    featured: true,
  },
  {
    name: "Lab",
    price: "$39",
    period: "/month",
    subtitle: "For small research teams",
    features: [
      "2M tokens/day",
      "Multi-user collaboration",
      "Shared citation workspace",
      "Version checkpoints",
      "AI contribution reports",
    ],
    cta: "Launch Lab",
    href: "/dashboard",
  },
  {
    name: "Institution",
    price: "Custom",
    period: "",
    subtitle: "For departments and universities",
    features: [
      "Enterprise token pool",
      "SSO / SAML",
      "Policy + compliance controls",
      "Dedicated deployment support",
      "Custom procurement terms",
    ],
    cta: "Contact Team",
    href: "#",
    enterprise: true,
  },
];

export function Pricing() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" ref={ref} className="py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-brand-700">Pricing Architecture</p>
          <h2 className="mt-4 font-serif text-4xl font-semibold text-ink-950 sm:text-5xl">
            Plans designed for individual scholars and research organizations
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-600">
            Start free, then scale by publication volume and collaboration intensity. No hidden model-routing charges.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier, index) => (
            <motion.article
              key={tier.name}
              initial={{ opacity: 0, y: 22 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className={cn(
                "relative flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm",
                tier.featured
                  ? "border-mercury-300 shadow-glow"
                  : tier.enterprise
                    ? "border-brand-300"
                    : "border-ink-200"
              )}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-mercury-600 px-3 py-1 text-xs font-semibold text-white shadow-glow">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Most active plan
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">{tier.name}</p>
                {tier.enterprise ? (
                  <Crown className="h-4 w-4 text-brand-600" />
                ) : (
                  <UsersRound className="h-4 w-4 text-mercury-600" />
                )}
              </div>

              <p className="mt-3 text-xs uppercase tracking-[0.12em] text-ink-500">{tier.subtitle}</p>
              <div className="mt-4 flex items-end gap-1">
                <p className="font-serif text-4xl font-semibold text-ink-950">{tier.price}</p>
                {tier.period && <p className="pb-1 text-sm text-ink-500">{tier.period}</p>}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-ink-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-mercury-600" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={tier.href} className="mt-7">
                <Button variant={tier.featured ? "mercury" : "outline"} className="w-full">
                  {tier.cta}
                </Button>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
