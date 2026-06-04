import { LinkButton } from "@/components/ui";
import { Logo } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="mt-10 font-serif text-7xl font-bold text-primary">404</p>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-foreground">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-base text-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="mt-6 flex gap-3">
        <LinkButton href="/">Back to home</LinkButton>
        <LinkButton href="/dashboard" variant="secondary">
          Go to dashboard
        </LinkButton>
      </div>
    </div>
  );
}
