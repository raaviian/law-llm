import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listThreads, listMessages, listDocuments } from "@/lib/data";
import { createThread } from "@/lib/actions";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { ChatPanel } from "@/components/chat-panel";
import { cn } from "@/lib/utils";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ thread?: string }>;
}) {
  const { caseId } = await params;
  const { thread } = await searchParams;
  const user = await requireUser();

  const [threads, docs] = await Promise.all([
    listThreads(user.id, caseId),
    listDocuments(user.id, caseId),
  ]);

  const activeThreadId = thread ?? threads[0]?.id;
  const messages = activeThreadId
    ? await listMessages(user.id, activeThreadId)
    : [];
  const hasDocuments = docs.some((d) => d.status === "ready");

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-3">
        <form
          action={async () => {
            "use server";
            const id = await createThread(caseId);
            redirect(`/cases/${caseId}/chat?thread=${id}`);
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            + New chat
          </button>
        </form>

        <Card className="overflow-hidden">
          {threads.length === 0 ? (
            <p className="px-3 py-3 text-xs text-muted">No conversations yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {threads.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/cases/${caseId}/chat?thread=${t.id}`}
                    className={cn(
                      "block truncate px-3 py-2 text-sm",
                      t.id === activeThreadId
                        ? "bg-primary/5 font-medium text-primary"
                        : "text-muted hover:bg-slate-50 hover:text-foreground",
                    )}
                  >
                    {t.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </aside>

      <ChatPanel
        key={activeThreadId ?? "new"}
        caseId={caseId}
        threadId={activeThreadId}
        initialMessages={messages}
        hasDocuments={hasDocuments}
      />
    </div>
  );
}
