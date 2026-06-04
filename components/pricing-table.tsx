"use client";

import { useState } from "react";
import { LinkButton } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Tier {
  name: string;
  monthly: number | null; // null = custom
  blurb: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

const tiers: Tier[] = [
  {
    name: "Free",
    monthly: 0,
    blurb: "Try it on a single matter.",
    features: ["1 case", "Document chat (limited)", "Notes & deadlines"],
    cta: "Start free",
  },
  {
    name: "Solo",
    monthly: 39,
    blurb: "For independent lawyers.",
    features: [
      "Unlimited cases",
      "Document chat with citations",
      "Court strategy board",
      "Notes & deadlines",
    ],
    cta: "Choose Solo",
    highlight: true,
  },
  {
    name: "Firm",
    monthly: 69,
    blurb: "For small & growing firms.",
    features: [
      "Everything in Solo",
      "Add teammates (per seat)",
      "Centralized billing",
    ],
    cta: "Choose Firm",
  },
  {
    name: "Enterprise",
    monthly: null,
    blurb: "For larger practices.",
    features: ["SSO / SAML", "Custom terms", "Onboarding & support"],
    cta: "Contact sales",
  },
];

export function PricingTable() {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      {/* Billing toggle */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setAnnual(false)}
          className={cn(
            "text-base transition-colors",
            !annual ? "font-medium text-foreground" : "text-muted hover:text-foreground",
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          aria-label="Toggle annual billing"
          onClick={() => setAnnual((a) => !a)}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
            annual ? "bg-primary" : "bg-slate-300",
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[translate] duration-200 ease-in-out",
              annual ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
        <button
          type="button"
          onClick={() => setAnnual(true)}
          className={cn(
            "text-base transition-colors",
            annual ? "font-medium text-foreground" : "text-muted hover:text-foreground",
          )}
        >
          Annual
        </button>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          Save ~17%
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t) => {
          const price =
            t.monthly === null
              ? "Custom"
              : t.monthly === 0
                ? "$0"
                : annual
                  ? `$${Math.round((t.monthly * 10) / 12)}`
                  : `$${t.monthly}`;
          return (
            <div
              key={t.name}
              className={cn(
                "flex flex-col rounded-xl border bg-card p-6 shadow-sm",
                t.highlight ? "border-primary ring-1 ring-primary" : "border-border",
              )}
            >
              <h3 className="font-serif text-2xl font-semibold text-foreground">
                {t.name}
              </h3>
              <p className="mt-1 text-base text-muted">{t.blurb}</p>
              <p className="mt-4 text-4xl font-bold text-foreground">
                {price}
                {t.monthly !== null && (
                  <span className="text-base font-normal text-muted">
                    {" "}
                    / seat / mo
                  </span>
                )}
              </p>
              {annual && t.monthly !== null && t.monthly > 0 && (
                <p className="mt-1 text-sm text-muted">billed annually</p>
              )}
              <ul className="mt-5 flex-1 space-y-2.5 text-base text-muted">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1 text-emerald-600">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <LinkButton
                href="/login"
                variant={t.highlight ? "primary" : "secondary"}
                className="mt-6 w-full"
              >
                {t.cta}
              </LinkButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}
