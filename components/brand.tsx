import Link from "next/link";
import { cn } from "@/lib/utils";
import { LinkButton } from "@/components/ui";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 text-xl font-bold tracking-tight text-primary",
        className,
      )}
    >
      <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-base font-bold text-primary-foreground">
        L
      </span>
      Lex<span className="-ml-1 text-accent">Board</span>
    </Link>
  );
}

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-6", className)}>{children}</div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
      <Container className="flex h-18 items-center justify-between py-2">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink href="/pricing">Pricing</NavLink>
          <Link
            href="/login"
            className="hidden rounded-md px-3 py-2 text-base font-medium text-muted transition-colors hover:bg-foreground/10 hover:text-foreground sm:inline"
          >
            Sign in
          </Link>
          <ThemeToggle />
          <LinkButton href="/login" size="md" className="ml-1">
            Get started
          </LinkButton>
        </nav>
      </Container>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <Container className="flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <Logo />
        <p className="text-center text-xs text-muted sm:text-right">
          LexBoard is a productivity tool, not a law firm, and its AI output is
          not legal advice.
          <br className="hidden sm:block" /> © {new Date().getFullYear()} LexBoard.
          All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
