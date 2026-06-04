import { LinkButton } from "@/components/ui";
import { Container, SiteHeader, SiteFooter } from "@/components/brand";
import { Reveal } from "@/components/reveal";

const features = [
  {
    title: "Case workspace",
    body: "Keep each matter in one place — client, court, jurisdiction, case number, and status.",
    icon: "📁",
  },
  {
    title: "Chat with your files",
    body: "Upload PDFs, Word docs, and notes, then ask questions. Answers are drawn from your documents and cite the source page.",
    icon: "💬",
  },
  {
    title: "Court strategy board",
    body: "Organize objectives, arguments, risks, and a timeline so your hearing prep lives in one structured view.",
    icon: "♟️",
  },
  {
    title: "Notes & deadlines",
    body: "Capture case notes and track hearings and filing dates alongside the documents they relate to.",
    icon: "🗓️",
  },
];

const steps = [
  {
    n: "1",
    title: "Create a case",
    body: "Add the matter with its client, court, and jurisdiction.",
  },
  {
    n: "2",
    title: "Upload documents",
    body: "Add PDFs or Word files. We extract and index the text securely.",
  },
  {
    n: "3",
    title: "Ask questions",
    body: "Chat with the case files and get answers cited to the source page.",
  },
];

const trust = [
  "🔒 Encrypted in transit & at rest",
  "📑 Answers cite their sources",
  "🗂️ Cases in any jurisdiction",
  "🚫 Your files aren’t used to train AI",
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <Container className="grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
            <div>
              <p className="mb-5 inline-block animate-fade-up rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary">
                AI case management for law practices
              </p>
              <h1 className="animate-fade-up font-serif text-5xl font-semibold leading-[1.1] tracking-tight text-foreground [animation-delay:100ms] sm:text-6xl">
                A private workspace that{" "}
                <span className="text-primary">reads your case files.</span>
              </h1>
              <p className="mt-6 max-w-xl animate-fade-up text-xl leading-relaxed text-muted [animation-delay:200ms]">
                Organize every matter, then ask questions in plain language.
                LexBoard answers from the documents you upload and cites the page
                it found the answer on.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3 animate-fade-up [animation-delay:300ms]">
                <LinkButton href="/login" size="lg">
                  Get started free
                </LinkButton>
                <LinkButton href="/pricing" variant="secondary" size="lg">
                  See pricing
                </LinkButton>
              </div>
              <p className="mt-4 animate-fade-up text-sm text-muted [animation-delay:400ms]">
                Start free on a single case — no credit card required.
              </p>
            </div>

            <div className="animate-float">
              <ChatMockup />
            </div>
          </Container>
        </section>

        {/* Trust strip */}
        <section className="border-y border-border bg-card">
          <Container className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-6 text-base text-muted">
            {trust.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </Container>
        </section>

        {/* How it works */}
        <section className="py-24">
          <Container>
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-serif text-4xl font-semibold tracking-tight text-foreground">
                From files to answers in minutes
              </h2>
              <p className="mt-4 text-lg text-muted">
                Three steps to turn a folder of documents into a conversation.
              </p>
            </Reveal>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <Reveal
                  key={s.n}
                  delay={["", "delay-150", "delay-300"][i]}
                  className="rounded-xl border border-border bg-card p-7"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {s.n}
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-base text-muted">{s.body}</p>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-card py-24">
          <Container>
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-serif text-4xl font-semibold tracking-tight text-foreground">
                Everything a matter needs
              </h2>
              <p className="mt-4 text-lg text-muted">
                Built for the day-to-day reality of running cases.
              </p>
            </Reveal>
            <div className="mt-14 grid gap-6 sm:grid-cols-2">
              {features.map((f, i) => (
                <Reveal
                  key={f.title}
                  delay={i % 2 === 1 ? "delay-150" : ""}
                  className="rounded-xl border border-border bg-background p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="text-3xl">{f.icon}</div>
                  <h3 className="mt-4 text-xl font-semibold text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-base text-muted">{f.body}</p>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA band */}
        <section className="py-24">
          <Container>
            <Reveal className="overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
              <h2 className="font-serif text-4xl font-semibold tracking-tight">
                Put your case files to work
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
                Start free on a single matter. Add seats when your practice grows.
              </p>
              <div className="mt-8">
                <LinkButton href="/login" variant="secondary" size="lg">
                  Get started free
                </LinkButton>
              </div>
            </Reveal>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function ChatMockup() {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-2xl">
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 text-sm text-muted">Acme Corp v. Smith — Chat</span>
      </div>
      <div className="space-y-3 rounded-xl bg-background p-4">
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-base text-primary-foreground">
            What are the key deadlines in the engagement letter?
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-base text-foreground">
            It sets two dates: a response deadline 14 days after service, and a
            discovery cut-off on 30 Sept 2026.
            <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-slate-200 pt-2.5">
              <span className="rounded bg-white px-1.5 py-0.5 text-xs text-muted ring-1 ring-slate-200">
                [1] engagement-letter.pdf p.3
              </span>
              <span className="rounded bg-white px-1.5 py-0.5 text-xs text-muted ring-1 ring-slate-200">
                [2] scheduling-order.pdf p.1
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-border px-3 py-2.5">
        <span className="flex-1 text-base text-muted">Ask about this case…</span>
        <span className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground">
          Send
        </span>
      </div>
    </div>
  );
}
