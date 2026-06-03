import Link from "next/link";
import { LinkButton } from "@/components/ui";
import { auth } from "@/lib/auth";

const features = [
  {
    title: "Case workspace",
    body: "Organize every matter in one place — parties, court, jurisdiction, status, deadlines, and notes.",
  },
  {
    title: "NotebookLLM for lawyers",
    body: "Upload case files and chat with an AI that answers only from your documents — with citations to the source page.",
  },
  {
    title: "Court strategy board",
    body: "Plan objectives, arguments, risks, and a timeline. Turn scattered thoughts into a clear hearing plan.",
  },
  {
    title: "Private by design",
    body: "Strict tenant isolation, your data stays yours, and we never train models on your clients' files.",
  },
];

export default async function Home() {
  const session = await auth();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold tracking-tight text-primary">
          Lex<span className="text-accent">Board</span>
        </span>
        <nav className="flex items-center gap-3">
          <Link href="/pricing" className="text-sm text-muted hover:text-foreground">
            Pricing
          </Link>
          {session ? (
            <LinkButton href="/dashboard" size="sm">
              Open app
            </LinkButton>
          ) : (
            <LinkButton href="/login" size="sm">
              Sign in
            </LinkButton>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-20 text-center">
          <p className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            AI case management for modern law practices
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Manage cases, plan strategy, and chat with your case files.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            LexBoard gives lawyers a private workspace for every matter — plus a
            built-in legal AI that reads your documents and answers with
            citations. Spend less time searching, more time advocating.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <LinkButton href="/login">Get started free</LinkButton>
            <LinkButton href="/pricing" variant="secondary">
              See pricing
            </LinkButton>
          </div>
        </section>

        <section className="grid gap-5 pb-24 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <h3 className="text-base font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        LexBoard — not a law firm and not legal advice. © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
