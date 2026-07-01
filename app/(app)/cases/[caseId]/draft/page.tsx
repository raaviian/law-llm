import { requireUser } from "@/lib/session";
import { listDocuments, listDrafts } from "@/lib/data";
import { DraftPanel } from "@/components/draft-panel";
import { Callout } from "@/components/callout";

export default async function DraftPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const user = await requireUser();
  const [docs, drafts] = await Promise.all([
    listDocuments(user.id, caseId),
    listDrafts(user.id, caseId),
  ]);
  const hasDocuments = docs.some((d) => d.status === "ready");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">AI drafting</h2>
        <p className="text-sm text-muted">
          Generate a first draft from this case&apos;s files — then review, edit,
          and save it.
        </p>
      </div>
      {!hasDocuments && (
        <Callout
          variant="tip"
          title="Upload documents for a grounded draft"
          action={{ href: `/cases/${caseId}/documents`, label: "Upload documents" }}
        >
          Drafts work best when they can use your case files. Upload documents
          first so the draft is based on real facts from the case.
        </Callout>
      )}
      <DraftPanel caseId={caseId} hasDocuments={hasDocuments} drafts={drafts} />
    </div>
  );
}
