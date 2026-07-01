import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getOrgRole } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui";
import { ShareIcon } from "@/components/icons";
import type { ChatMessage } from "@/lib/types";

const RANK: Record<string, number> = { member: 1, admin: 2, owner: 3 };

export default async function SharedChatPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // Require login so only authenticated firm members can ever reach a thread.
  const user = await requireUser();

  // Read via the ADMIN client, not createUserClient: a shared viewer may not
  // have case access (RLS is case-scoped), but is still allowed to see this
  // thread if they meet the org role floor below.
  const admin = createAdminClient();
  const { data: thread } = await admin
    .from("chat_threads")
    .select("id, org_id, title, share_min_role")
    .eq("share_token", token)
    .maybeSingle();

  // Not shared, or token unknown → 404 (don't reveal which it is).
  if (!thread || !thread.share_min_role) notFound();

  // Authorize by org membership + role floor (NOT case access).
  const role = await getOrgRole(user.id, thread.org_id as string);
  const minRole = thread.share_min_role as string;
  if (!role || (RANK[role] ?? 0) < (RANK[minRole] ?? 99)) notFound();

  const { data } = await admin
    .from("chat_messages")
    .select("*")
    .eq("thread_id", thread.id as string)
    .order("created_at", { ascending: true });
  const messages = (data ?? []) as ChatMessage[];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
          ← Back to LexBoard
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {thread.title as string}
          </h1>
        </div>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
          <ShareIcon className="h-4 w-4 text-accent" />
          Shared conversation (read-only)
        </p>
      </div>

      <Card className="space-y-4 p-5">
        {messages.length === 0 ? (
          <p className="text-sm text-muted">This conversation is empty.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                    : "max-w-[85%] rounded-2xl rounded-bl-sm bg-foreground/10 px-4 py-2.5 text-sm text-foreground"
                }
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.role === "assistant" && m.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border pt-2">
                    {m.citations.map((c) => (
                      <span
                        key={c.label}
                        className="rounded bg-card px-1.5 py-0.5 text-xs text-muted ring-1 ring-border"
                      >
                        [{c.label}] {c.documentName}
                        {c.page ? ` p.${c.page}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
