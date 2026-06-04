import { Container, SiteHeader, SiteFooter } from "@/components/brand";
import { PricingTable } from "@/components/pricing-table";

const faqs = [
  {
    q: "How is pricing calculated?",
    a: "Per seat, per month — one seat per lawyer. Add or remove seats anytime; annual billing saves roughly 17%.",
  },
  {
    q: "Is my client data private?",
    a: "Yes. Every organization's data is isolated at the database level, encrypted, and never used to train AI models.",
  },
  {
    q: "Which file types can I upload?",
    a: "PDF, DOCX, and plain text today. Files are processed so the AI can answer questions and cite the source page.",
  },
  {
    q: "Does the AI give legal advice?",
    a: "No. LexBoard is a productivity tool. It surfaces and summarizes your documents with citations, but you remain the lawyer.",
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="py-16">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="font-serif text-5xl font-semibold tracking-tight text-foreground">
                Simple, per-seat pricing
              </h1>
              <p className="mt-4 text-xl text-muted">
                Priced per lawyer, per month. Start free, upgrade as you grow.
              </p>
            </div>
            <div className="mt-12">
              <PricingTable />
            </div>
            <p className="mt-10 text-center text-sm text-muted">
              All plans include encryption, strict tenant isolation, and a
              guarantee that we never train models on your data.
            </p>
          </Container>
        </section>

        <section className="border-t border-border bg-card py-16">
          <Container className="max-w-3xl">
            <h2 className="text-center font-serif text-3xl font-semibold tracking-tight text-foreground">
              Frequently asked questions
            </h2>
            <dl className="mt-10 divide-y divide-border">
              {faqs.map((f) => (
                <div key={f.q} className="py-5">
                  <dt className="text-lg font-semibold text-foreground">{f.q}</dt>
                  <dd className="mt-2 text-base text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
