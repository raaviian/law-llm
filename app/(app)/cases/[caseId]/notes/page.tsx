import { requireUser } from "@/lib/session";
import { listNotes } from "@/lib/data";
import { createNote, deleteNote } from "@/lib/actions";
import { Button, Card, EmptyState, Input, Label } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const user = await requireUser();
  const notes = await listNotes(user.id, caseId);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Notes</h2>
        {notes.length === 0 ? (
          <EmptyState
            title="No notes yet"
            description="Capture observations, call summaries, and to-dos for this matter."
          />
        ) : (
          notes.map((n) => (
            <Card key={n.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {n.title && (
                    <h3 className="font-medium text-foreground">{n.title}</h3>
                  )}
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {n.body}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {formatDateTime(n.created_at)}
                  </p>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await deleteNote(caseId, n.id);
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs text-muted hover:text-red-600"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </Card>
          ))
        )}
      </div>

      <Card className="h-fit p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Add a note</h3>
        <form
          action={createNote.bind(null, caseId)}
          className="space-y-3"
        >
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Optional title" />
          </div>
          <div>
            <Label htmlFor="body">Note</Label>
            <textarea
              id="body"
              name="body"
              rows={5}
              required
              placeholder="Write your note…"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button type="submit" className="w-full">
            Save note
          </Button>
        </form>
      </Card>
    </div>
  );
}
