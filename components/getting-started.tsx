"use client";

import Link from "next/link";
import { Card, LinkButton } from "@/components/ui";
import { CheckCircleIcon, CircleIcon, XIcon } from "@/components/icons";
import { useLocalStorage } from "@/lib/use-local-storage";
import { cn } from "@/lib/utils";

/**
 * A dismissible "getting started" checklist that reflects real progress through
 * the core journey: create a case → upload documents → ask about your files.
 * Auto-hides once every step is done, and stays dismissed via localStorage.
 */
export function GettingStarted({
  hasCase,
  hasDocument,
  hasChat,
  firstCaseId,
}: {
  hasCase: boolean;
  hasDocument: boolean;
  hasChat: boolean;
  firstCaseId?: string;
}) {
  const [dismissed, setDismissed] = useLocalStorage<"0" | "1">(
    "onboarding:dismissed",
    "0",
  );

  const steps = [
    {
      done: hasCase,
      title: "Create your first case",
      desc: "A case keeps everything for one client in one place — its files, chats, notes and deadlines.",
      href: "/cases/new",
      cta: "Create a case",
    },
    {
      done: hasDocument,
      title: "Upload documents to a case",
      desc: "Add your case files (PDF, Word, or text). We read them so the AI can answer from them.",
      href: firstCaseId ? `/cases/${firstCaseId}/documents` : "/cases/new",
      cta: "Upload documents",
    },
    {
      done: hasChat,
      title: "Ask questions about your files",
      desc: "Open Chat and ask anything about the case — every answer cites the source page.",
      href: firstCaseId ? `/cases/${firstCaseId}/chat` : "/cases/new",
      cta: "Open chat",
    },
  ];

  const allDone = steps.every((s) => s.done);
  if (allDone || dismissed === "1") return null;

  const nextIndex = steps.findIndex((s) => !s.done);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Getting started
          </h2>
          <p className="text-sm text-muted">
            {doneCount} of {steps.length} done — follow these steps to start
            working with your files.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed("1")}
          aria-label="Dismiss getting started"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted hover:bg-foreground/10 hover:text-foreground"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <ol className="mt-4 space-y-2">
        {steps.map((step, i) => {
          const isNext = i === nextIndex;
          return (
            <li
              key={step.title}
              className={cn(
                "flex items-start gap-3 rounded-lg p-3",
                isNext ? "bg-primary/[0.06] ring-1 ring-primary/20" : "",
              )}
            >
              {step.done ? (
                <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <CircleIcon
                  className={cn(
                    "mt-0.5 h-5 w-5 shrink-0",
                    isNext ? "text-primary" : "text-muted/50",
                  )}
                />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.done ? "text-muted line-through" : "text-foreground",
                  )}
                >
                  {step.title}
                </p>
                {!step.done && (
                  <p className="mt-0.5 text-xs text-muted">{step.desc}</p>
                )}
              </div>
              {isNext && (
                <LinkButton href={step.href} size="sm" className="shrink-0">
                  {step.cta}
                </LinkButton>
              )}
              {!step.done && !isNext && (
                <Link
                  href={step.href}
                  className="shrink-0 self-center text-xs font-medium text-muted hover:text-foreground"
                >
                  {step.cta}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
