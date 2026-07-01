import { requireUser } from "@/lib/session";
import { listNotes } from "@/lib/data";
import { createNote } from "@/lib/actions";
import { Card, EmptyState, Input, Label, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { NotesView } from "@/components/notes-view";

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
            description="Capture observations, call summaries, and to-dos for this case."
          />
        ) : (
          <NotesView caseId={caseId} notes={notes} />
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
            <Textarea id="body" name="body" rows={5} required placeholder="Write your note…" />
          </div>
          <SubmitButton pendingText="Saving…" className="w-full">
            Save note
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
