import { requireUser } from "@/lib/session";
import { listDeadlines } from "@/lib/data";
import { createDeadline, toggleDeadline } from "@/lib/actions";
import { Badge, Button, Card, EmptyState, Input, Label } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export default async function DeadlinesPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const user = await requireUser();
  const deadlines = await listDeadlines(user.id, caseId);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Deadlines</h2>
        {deadlines.length === 0 ? (
          <EmptyState
            title="No deadlines yet"
            description="Track hearings, filing dates, and reminders for this case."
          />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {deadlines.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <form
                      action={async () => {
                        "use server";
                        await toggleDeadline(caseId, d.id, !d.done);
                      }}
                    >
                      <button
                        type="submit"
                        aria-label="Toggle done"
                        className={
                          d.done
                            ? "h-5 w-5 rounded border border-emerald-500 bg-emerald-500 text-xs text-white"
                            : "h-5 w-5 rounded border border-border"
                        }
                      >
                        {d.done ? "✓" : ""}
                      </button>
                    </form>
                    <div>
                      <p
                        className={
                          d.done
                            ? "text-sm text-muted line-through"
                            : "text-sm font-medium text-foreground"
                        }
                      >
                        {d.title}
                      </p>
                      <p className="text-xs text-muted">
                        {formatDateTime(d.due_at)}
                      </p>
                    </div>
                  </div>
                  <Badge status={d.type} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Card className="h-fit p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Add a deadline
        </h3>
        <form action={createDeadline.bind(null, caseId)} className="space-y-3">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="File defense" />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              defaultValue="reminder"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="hearing">Hearing</option>
              <option value="filing">Filing</option>
              <option value="reminder">Reminder</option>
            </select>
          </div>
          <div>
            <Label htmlFor="due_at">Due</Label>
            <Input id="due_at" name="due_at" type="datetime-local" required />
          </div>
          <Button type="submit" className="w-full">
            Add deadline
          </Button>
        </form>
      </Card>
    </div>
  );
}
