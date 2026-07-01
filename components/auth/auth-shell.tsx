import Link from "next/link";
import { Logo } from "@/components/brand";

const valueProps = [
  "A private workspace for every matter",
  "Chat with your case files — answers cite the source page",
  "Court strategy board, notes & deadlines",
  "Encrypted, and your files aren’t used to train AI",
];

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-surface-deep p-12 text-on-deep lg:flex">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-white/15 text-sm font-bold">
            L
          </span>
          Lex<span className="-ml-1 text-accent">Board</span>
        </Link>
        <div>
          <h2 className="font-serif text-4xl font-semibold leading-tight">
            The case workspace that reads your files.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {valueProps.map((v) => (
              <li
                key={v}
                className="flex items-start gap-3 text-lg text-on-deep/90"
              >
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/15 text-xs">
                  ✓
                </span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-base text-on-deep/70">
          Built for solo lawyers and small firms.
        </p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-base text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-xs text-muted">
            By continuing you agree this tool does not provide legal advice.
          </p>
          <p className="mt-2 text-center text-xs text-muted">
            <Link href="/" className="hover:text-foreground">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-wide text-muted">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
