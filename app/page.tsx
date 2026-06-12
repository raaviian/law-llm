import { LinkButton } from "@/components/ui";
import { Container, SiteHeader, SiteFooter } from "@/components/brand";
import { Reveal } from "@/components/reveal";
import { ConsultationForm } from "@/components/landing/booking";
import {
  ScaleIcon,
  BuildingIcon,
  HeartIcon,
  GlobeIcon,
  ShieldIcon,
  HomeIcon,
  LockIcon,
  DocCheckIcon,
  ClockIcon,
  CheckIcon,
  QuoteIcon,
} from "@/components/icons";

const trust = [
  { icon: ScaleIcon, label: "Bar-admitted counsel" },
  { icon: LockIcon, label: "Confidential & privileged" },
  { icon: DocCheckIcon, label: "Transparent engagements" },
  { icon: ClockIcon, label: "Response within 1 business day" },
];

const practiceAreas = [
  { icon: ScaleIcon, title: "Litigation & Disputes", body: "Strategic representation in complex commercial and civil disputes, from filing to trial." },
  { icon: BuildingIcon, title: "Corporate & Commercial", body: "Formation, contracts, M&A, and trusted day-to-day counsel for growing businesses." },
  { icon: HeartIcon, title: "Family Law", body: "Compassionate, discreet guidance through divorce, custody, and estate matters." },
  { icon: GlobeIcon, title: "Immigration", body: "Visas, residency, and cross-border compliance handled end to end." },
  { icon: ShieldIcon, title: "Intellectual Property", body: "Protect trademarks, patents, and the ideas that set you apart." },
  { icon: HomeIcon, title: "Real Estate", body: "Transactions, leasing, and property dispute resolution with clear timelines." },
];

const stats = [
  { value: "1,200+", label: "Matters resolved" },
  { value: "98%", label: "Client satisfaction" },
  { value: "$50M+", label: "Recovered for clients" },
  { value: "25+", label: "Years of experience" },
];

const results = [
  { headline: "$4.2M settlement", area: "Commercial dispute", body: "Recovered damages for a breached cross-border supply agreement, avoiding trial." },
  { headline: "Charges dismissed", area: "Regulatory defense", body: "Full dismissal secured after challenging the integrity of the evidence chain." },
  { headline: "Closed in 30 days", area: "M&A acquisition", body: "Led diligence and negotiation for a time-critical acquisition under deadline." },
];

const attorneys = [
  { name: "Amara Okafor", title: "Managing Partner", focus: "Litigation · Corporate" },
  { name: "Daniel Reyes", title: "Senior Partner", focus: "Immigration · Family" },
  { name: "Sofia Lindqvist", title: "Partner", focus: "IP · Commercial" },
  { name: "Marcus Chen", title: "Associate", focus: "Real Estate · Disputes" },
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent" />
          <Container className="py-20 text-center lg:py-28">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1.5 text-sm font-medium text-[#8a6d1f]">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Trusted legal counsel since 1998
            </p>
            <h1 className="mx-auto max-w-3xl animate-fade-up font-serif text-5xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
              Clear, decisive counsel{" "}
              <span className="text-primary">when it matters most.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-xl leading-relaxed text-muted [animation-delay:120ms]">
              A boutique firm pairing seasoned attorneys with modern case
              intelligence — so your matter is handled with rigor, discretion,
              and speed.
            </p>
            <div className="mt-9 flex animate-fade-up flex-wrap items-center justify-center gap-3 [animation-delay:240ms]">
              <LinkButton href="#consult" size="lg">
                Request a consultation
              </LinkButton>
              <LinkButton href="#practice" variant="secondary" size="lg">
                Our practice areas
              </LinkButton>
            </div>
          </Container>

          {/* Trust strip */}
          <div className="border-t border-border bg-card">
            <Container className="grid grid-cols-2 gap-4 py-6 sm:grid-cols-4">
              {trust.map((t) => (
                <div key={t.label} className="flex items-center justify-center gap-2.5 text-center">
                  <t.icon className="h-5 w-5 shrink-0 text-accent" />
                  <span className="text-sm text-muted">{t.label}</span>
                </div>
              ))}
            </Container>
          </div>
        </section>

        {/* Practice areas */}
        <section id="practice" className="scroll-mt-20 py-24">
          <Container>
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">
                Practice areas
              </p>
              <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-foreground">
                Counsel across the matters that move your life and business
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {practiceAreas.map((p, i) => (
                <Reveal
                  key={p.title}
                  delay={["", "delay-100", "delay-200"][i % 3]}
                  className="group rounded-xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/[0.07] text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <p.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-foreground">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-muted">
                    {p.body}
                  </p>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* Case results — navy band with gold numbers */}
        <section className="bg-primary py-20 text-primary-foreground">
          <Container>
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">
                Case results
              </p>
              <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
                A track record built on outcomes
              </h2>
            </Reveal>
            <div className="mt-12 grid grid-cols-2 gap-8 lg:grid-cols-4">
              {stats.map((s, i) => (
                <Reveal key={s.label} delay={["", "delay-100", "delay-200", "delay-300"][i]} className="text-center">
                  <div className="font-serif text-4xl font-bold text-accent sm:text-5xl">
                    {s.value}
                  </div>
                  <div className="mt-2 text-sm text-primary-foreground/70">
                    {s.label}
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {results.map((r) => (
                <Reveal
                  key={r.headline}
                  className="rounded-xl border border-white/15 bg-white/[0.06] p-6 backdrop-blur"
                >
                  <QuoteIcon className="h-6 w-6 text-accent" />
                  <p className="mt-3 text-xl font-semibold">{r.headline}</p>
                  <p className="text-sm font-medium text-accent">{r.area}</p>
                  <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
                    {r.body}
                  </p>
                </Reveal>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-primary-foreground/50">
              Prior results do not guarantee a similar outcome. Illustrative case summaries.
            </p>
          </Container>
        </section>

        {/* Attorneys */}
        <section id="attorneys" className="scroll-mt-20 border-b border-border bg-card py-24">
          <Container>
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">
                Our attorneys
              </p>
              <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-foreground">
                Experienced advocates in your corner
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {attorneys.map((a, i) => (
                <Reveal
                  key={a.name}
                  delay={["", "delay-100", "delay-200", "delay-300"][i]}
                  className="rounded-xl border border-border bg-background p-6 text-center"
                >
                  <span
                    className="mx-auto grid h-20 w-20 place-items-center rounded-full font-serif text-2xl font-semibold text-white"
                    style={{ background: "linear-gradient(135deg,#1e3a8a,#3b5bbf)" }}
                  >
                    {initials(a.name)}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {a.name}
                  </h3>
                  <p className="text-sm font-medium text-primary">{a.title}</p>
                  <p className="mt-1 text-xs text-muted">{a.focus}</p>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* Consultation booking */}
        <section id="consult" className="scroll-mt-20 py-24">
          <Container className="grid items-start gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">
                Book a consultation
              </p>
              <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-foreground">
                Let's talk about your matter
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted">
                Tell us a little about your situation and we'll arrange an
                initial consultation — confidential, no obligation.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "A direct conversation with an attorney, not an intake bot",
                  "Honest assessment of your options and likely costs",
                  "Everything you share is confidential and privileged",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-base text-foreground">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay="delay-150">
              <ConsultationForm />
            </Reveal>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
