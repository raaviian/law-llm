import { requireUser } from "@/lib/session";
import { listAuditLogs } from "@/lib/data";
import { Card, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  "case.create": "Created case",
  "case.update": "Updated case",
  "case.delete": "Deleted case",
  "document.upload": "Uploaded document",
  "document.view": "Viewed document",
  "document.delete": "Deleted document",
  "note.create": "Added note",
  "deadline.create": "Added deadline",
  "chat.query": "Asked the assistant",
  "thread.create": "Started a chat",
  "draft.create": "Generated a draft",
  "strategy.generate": "Generated strategy",
  "member.invite": "Invited a member",
  "member.remove": "Removed a member",
};

const ACTION_COLORS: Record<string, string> = {
  case: "bg-blue-50 text-blue-700 ring-blue-600/20",
  document: "bg-violet-50 text-violet-700 ring-violet-600/20",
  note: "bg-amber-50 text-amber-700 ring-amber-600/20",
  deadline: "bg-rose-50 text-rose-700 ring-rose-600/20",
  chat: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  draft: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  strategy: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  member: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
};

export default async function AuditPage() {
  const user = await requireUser();
  const logs = await listAuditLogs(user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">
          Activity log
        </h1>
        <p className="mt-1 text-base text-muted">
          An append-only record of actions across your firm&apos;s cases.
        </p>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Actions like creating cases, uploading documents, and asking the assistant will appear here."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {logs.map((log) => {
              const type = log.action.split(".")[0];
              return (
                <li
                  key={log.id}
                  className="flex items-start justify-between gap-4 px-5 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          ACTION_COLORS[type] ??
                          "bg-slate-100 text-slate-600 ring-slate-500/20"
                        }`}
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-foreground">
                      {log.summary ?? "—"}
                    </p>
                    <p className="text-xs text-muted">
                      {log.actor_email ?? "Unknown user"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {formatDateTime(log.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
