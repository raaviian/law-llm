import { requireUser } from "@/lib/session";
import { listThreads, listMessages, listDocuments } from "@/lib/data";
import { createThread } from "@/lib/actions";
import { redirect } from "next/navigation";
import { ChatPanel } from "@/components/chat-panel";
import { ThreadList } from "@/components/thread-list";
import { Callout } from "@/components/callout";

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
    <div className="space-y-4">
      {!hasDocuments && (
        <Callout
          variant="tip"
          title="Upload documents to chat with them"
          action={{ href: `/cases/${caseId}/documents`, label: "Upload documents" }}
        >
          Chat answers come from this case&apos;s files. Add some documents
          first, then ask questions here — each answer cites its source page.
        </Callout>
      )}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
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
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-foreground/5"
          >
            + New chat
          </button>
        </form>

        <ThreadList
          caseId={caseId}
          threads={threads}
          activeThreadId={activeThreadId}
        />
      </aside>

      <ChatPanel
        key={activeThreadId ?? "new"}
        caseId={caseId}
        threadId={activeThreadId}
        initialMessages={messages}
        hasDocuments={hasDocuments}
      />
      </div>
    </div>
  );
}
