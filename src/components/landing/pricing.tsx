"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const tiers = [
  {
    name: "Scholar",
    price: "$0",
    period: "/month",
    subtitle: "For getting started",
    features: [
      "3 papers",
      "Basic AI writing",
      "Citation search",
      "Local storage",
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
      "Unlimited papers",
      "All AI writing modes",
      "Full citation tools",
      "PDF and DOCX export",
    ],
    cta: "Get Started",
    href: "/dashboard",
    featured: true,
  },
  {
    name: "Lab",
    price: "$39",
    period: "/month",
    subtitle: "For research teams",
    features: [
      "Everything in Researcher",
      "Collaboration tools",
      "Shared citations",
      "Version history",
    ],
    cta: "Get Started",
    href: "/dashboard",
  },
  {
    name: "Institution",
    price: "Custom",
    period: "",
    subtitle: "For departments",
    features: [
      "Everything in Lab",
      "SSO and admin controls",
      "Dedicated support",
      "Custom procurement",
    ],
    cta: "Contact Us",
    href: "#",
    enterprise: true,
  },
];

export function Pricing() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="pricing" ref={ref} className="bg-ink-50/70 py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600">
            Pricing
          </p>
          <h2 className="font-serif text-3xl font-semibold text-ink-950 md:text-4xl lg:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-500">
            Start free. Upgrade as your research grows.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier, index) => (
            <motion.article
              key={tier.name}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className={cn(
                "relative flex flex-col rounded-2xl p-7",
                tier.featured
                  ? "border-2 border-brand-600 bg-brand-950 shadow-xl shadow-brand-900/30"
                  : "border border-ink-200 bg-white shadow-sm"
              )}
            >
              {/* Popular badge */}
              {tier.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white shadow">
                    <Zap className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Tier name */}
              <div>
                <p
                  className={cn(
                    "text-base font-semibold",
                    tier.featured ? "text-white" : "text-ink-900"
                  )}
                >
                  {tier.name}
                </p>
                <p
                  className={cn(
                    "mt-1 text-xs uppercase tracking-wide",
                    tier.featured ? "text-brand-300/70" : "text-ink-400"
                  )}
                >
                  {tier.subtitle}
                </p>
              </div>

              {/* Price */}
              <div className="mt-7 flex items-end gap-1">
                <p
                  className={cn(
                    "text-4xl font-bold",
                    tier.featured ? "text-white" : "text-ink-950"
                  )}
                >
                  {tier.price}
                </p>
                {tier.period && (
                  <p
                    className={cn(
                      "pb-1 text-sm",
                      tier.featured ? "text-brand-300/70" : "text-ink-400"
                    )}
                  >
                    {tier.period}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div
                className={cn(
                  "my-6 h-px",
                  tier.featured ? "bg-brand-800" : "bg-ink-100"
                )}
              />

              {/* Features */}
              <ul className="flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <div
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                        tier.featured
                          ? "bg-brand-600/30"
                          : "bg-brand-50"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-2.5 w-2.5",
                          tier.featured ? "text-brand-300" : "text-brand-600"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        tier.featured ? "text-brand-100/80" : "text-ink-600"
                      )}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-8">
                <Link
                  href={tier.href}
                  className={cn(
                    "block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all duration-150",
                    tier.featured
                      ? "bg-white text-brand-950 hover:bg-brand-50 shadow"
                      : tier.enterprise
                      ? "border border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
                      : "border border-ink-200 bg-white text-ink-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                  )}
                >
                  {tier.cta}
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
