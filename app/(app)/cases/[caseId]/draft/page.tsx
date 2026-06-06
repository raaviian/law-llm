import { requireUser } from "@/lib/session";
import { listDocuments } from "@/lib/data";
import { DraftPanel } from "@/components/draft-panel";

export default async function DraftPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const user = await requireUser();
  const docs = await listDocuments(user.id, caseId);
  const hasDocuments = docs.some((d) => d.status === "ready");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">AI drafting</h2>
        <p className="text-sm text-muted">
          Generate a first draft grounded in this case&apos;s documents — then
          review, edit, and save it.
        </p>
      </div>
      <DraftPanel caseId={caseId} hasDocuments={hasDocuments} />
    </div>
  );
}
