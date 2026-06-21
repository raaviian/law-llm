"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CollectionView } from "@/components/collection-view";
import { CopyButton } from "@/components/copy-button";
import { PencilIcon, TrashIcon, ShareIcon } from "@/components/icons";
import { renameThread, deleteThread, setThreadShare } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { ChatThread } from "@/lib/types";

type Role = "member" | "admin" | "owner";

export function ThreadList({
  caseId,
  threads,
  activeThreadId,
}: {
  caseId: string;
  threads: ChatThread[];
  activeThreadId?: string;
}) {
  return (
    <CollectionView<ChatThread>
      items={threads}
      storageKey="view:threads"
      defaultView="list"
      modes={["list", "grid"]}
      gridClassName="grid gap-2"
      listClassName="space-y-1"
      searchPlaceholder="Search chats…"
      itemKey={(t) => t.id}
      searchFields={(t) => t.title}
      sort={{
        defaultKey: "newest",
        options: [
          { value: "newest", label: "Newest" },
          { value: "title", label: "Title (A–Z)" },
        ],
        compare: (a, b, key) =>
          key === "title"
            ? a.title.localeCompare(b.title)
            : b.created_at.localeCompare(a.created_at),
      }}
      renderEmpty={<p className="py-3 text-xs text-muted">No conversations yet.</p>}
      renderItem={(t) => (
        <ThreadRow
          caseId={caseId}
          thread={t}
          active={t.id === activeThreadId}
        />
      )}
    />
  );
}

function ThreadRow({
  caseId,
  thread,
  active,
}: {
  caseId: string;
  thread: ChatThread;
  active: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [menu, setMenu] = useState<null | "rename" | "share">(null);
  const [name, setName] = useState(thread.title);
  const [role, setRole] = useState<Role>(thread.share_min_role ?? "member");
  const [shareUrl, setShareUrl] = useState<string | null>(
    thread.share_token
      ? // Built client-side so we don't need the server's APP_URL here.
        (typeof window !== "undefined"
          ? `${window.location.origin}/shared/chat/${thread.share_token}`
          : null)
      : null,
  );

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div
      className={cn(
        "rounded-lg border px-2 py-1.5",
        active ? "border-primary/30 bg-primary/5" : "border-transparent",
      )}
    >
      <div className="flex items-center gap-1">
        <Link
          href={`/cases/${caseId}/chat?thread=${thread.id}`}
          className={cn(
            "min-w-0 flex-1 truncate text-sm",
            active ? "font-medium text-primary" : "text-muted hover:text-foreground",
          )}
        >
          {thread.title}
          {thread.share_min_role && (
            <ShareIcon className="ml-1 inline h-3 w-3 align-[-1px] text-accent" />
          )}
        </Link>
        <button
          type="button"
          aria-label="Rename chat"
          onClick={() => setMenu(menu === "rename" ? null : "rename")}
          className="shrink-0 rounded p-1 text-muted hover:bg-foreground/10 hover:text-foreground"
        >
          <PencilIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Share chat"
          onClick={() => setMenu(menu === "share" ? null : "share")}
          className="shrink-0 rounded p-1 text-muted hover:bg-foreground/10 hover:text-foreground"
        >
          <ShareIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Delete chat"
          disabled={pending}
          onClick={() => {
            if (confirm("Delete this chat and its messages?")) {
              run(() => deleteThread(caseId, thread.id));
            }
          }}
          className="shrink-0 rounded p-1 text-muted hover:bg-foreground/10 hover:text-red-600"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {menu === "rename" && (
        <form
          action={() => {
            run(async () => {
              await renameThread(caseId, thread.id, name);
              setMenu(null);
            });
          }}
          className="mt-1.5 flex gap-1"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
          >
            Save
          </button>
        </form>
      )}

      {menu === "share" && (
        <div className="mt-1.5 space-y-1.5 rounded-md bg-foreground/5 p-2">
          <p className="text-xs text-muted">
            Minimum role that can open the link:
          </p>
          <div className="flex gap-1">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="min-w-0 flex-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="member">Members & up</option>
              <option value="admin">Admins & up</option>
              <option value="owner">Owners only</option>
            </select>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const url = await setThreadShare(caseId, thread.id, role);
                  setShareUrl(url);
                })
              }
              className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
            >
              {thread.share_min_role ? "Update" : "Share"}
            </button>
          </div>
          {shareUrl && (
            <div className="flex items-center gap-1">
              <input
                readOnly
                value={shareUrl}
                className="min-w-0 flex-1 truncate rounded-md border border-border bg-card px-2 py-1 text-xs text-muted"
              />
              <CopyButton text={shareUrl} />
            </div>
          )}
          {thread.share_min_role && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await setThreadShare(caseId, thread.id, null);
                  setShareUrl(null);
                })
              }
              className="text-xs text-muted hover:text-red-600"
            >
              Stop sharing
            </button>
          )}
        </div>
      )}
    </div>
  );
}
