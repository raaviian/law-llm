import { requireUser } from "@/lib/session";
import { getStrategy, listDocuments } from "@/lib/data";
import { GenerateStrategyButton } from "@/components/generate-strategy-button";
import { StrategyBoard, type StrategyData } from "@/components/strategy-board";

export default async function StrategyPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const user = await requireUser();
  const [strategy, docs] = await Promise.all([
    getStrategy(user.id, caseId),
    listDocuments(user.id, caseId),
  ]);
  const hasDocuments = docs.some((d) => d.status === "ready");

  const data: StrategyData = {
    objectives: strategy?.objectives ?? [],
    arguments: strategy?.arguments ?? [],
    risks: strategy?.risks ?? [],
    timeline: strategy?.timeline ?? [],
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Court strategy</h2>
          <p className="text-sm text-muted">
            Plan your case across four areas — Objectives, Arguments, Risks and
            Timeline — or let AI suggest a first draft from your files, then edit.
          </p>
        </div>
        <GenerateStrategyButton caseId={caseId} hasDocuments={hasDocuments} />
      </div>
      <StrategyBoard caseId={caseId} strategy={data} />
    </div>
  );
}
