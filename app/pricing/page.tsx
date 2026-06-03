import Link from "next/link";
import { LinkButton } from "@/components/ui";

const tiers = [
  {
    name: "Free",
    price: "$0",
    blurb: "Try it on a single matter.",
    features: ["1 case", "Limited AI chats", "Document upload"],
    cta: "Start free",
  },
  {
    name: "Solo",
    price: "$39",
    blurb: "For independent lawyers.",
    features: [
      "Unlimited cases",
      "Document chat with citations",
      "Notes, strategy & deadlines",
    ],
    cta: "Choose Solo",
    highlight: true,
  },
  {
    name: "Firm",
    price: "$69",
    blurb: "For small & growing firms.",
    features: [
      "Everything in Solo",
      "Team seats & roles",
      "Higher AI usage limits",
      "Priority processing",
    ],
    cta: "Choose Firm",
  },
  {
    name: "Enterprise",
    price: "Custom",
    blurb: "For larger practices.",
    features: ["SSO / SAML", "Data residency", "Audit logs & SLA", "Onboarding"],
    cta: "Contact sales",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-bold tracking-tight text-primary">
          Lex<span className="text-accent">Board</span>
        </Link>
        <LinkButton href="/login" size="sm">
          Sign in
        </LinkButton>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Simple, per-seat pricing
          </h1>
          <p className="mt-3 text-muted">
            Priced per lawyer, per month. Save with annual billing.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`flex flex-col rounded-xl border bg-card p-6 shadow-sm ${
                t.highlight ? "border-primary ring-1 ring-primary" : "border-border"
              }`}
            >
              <h3 className="text-lg font-semibold text-foreground">{t.name}</h3>
              <p className="text-sm text-muted">{t.blurb}</p>
              <p className="mt-4 text-2xl font-bold text-foreground">
                {t.price}
                {t.price !== "Custom" && (
                  <span className="text-sm font-normal text-muted">
                    {" "}
                    / seat / mo
                  </span>
                )}
              </p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-muted">
                {t.features.map((f) => (
                  <li key={f}>✓ {f}</li>
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
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted">
          All plans include encryption, strict tenant isolation, and a guarantee
          that we never train models on your data.
        </p>
      </main>
    </div>
  );
}
