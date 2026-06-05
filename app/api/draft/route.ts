import { auth } from "@/lib/auth";
import { getCase } from "@/lib/data";
import { streamGemini, type GeminiContent } from "@/lib/ai/gemini";
import { retrieveContext, buildContextBlock } from "@/lib/ai/rag";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

const DRAFT_TYPES: Record<string, string> = {
  client_update: "client update email summarizing status and next steps",
  demand_letter: "formal demand letter",
  summary_memo: "internal case summary memo",
  argument_outline: "outline of legal arguments with supporting points",
};

const SYSTEM = `You are a legal drafting assistant for a lawyer. Draft the requested document grounded ONLY in the provided case context.
Rules:
- Use a professional tone appropriate to the document type.
- Where a specific detail (name, date, figure) is not in the context, insert a clearly marked [PLACEHOLDER] rather than inventing it.
- Do not fabricate facts, citations, or legal authority.
- This is a draft for a lawyer to review and finalize; it is not legal advice.`;

interface DraftBody {
  caseId: string;
  docType: string;
  instructions?: string;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const { caseId, docType, instructions } = (await req.json()) as DraftBody;
  const typeLabel = DRAFT_TYPES[docType];
  if (!caseId || !typeLabel) {
    return new Response("Missing or invalid caseId/docType", { status: 400 });
  }

  const caseRow = await getCase(userId, caseId);
  if (!caseRow) return new Response("Case not found", { status: 403 });

  const query = `${typeLabel}. ${instructions ?? ""}`.trim();
  const chunks = await retrieveContext(userId, caseId, query, 10);
  const contextBlock = buildContextBlock(chunks);

  await recordAudit({
    orgId: caseRow.org_id,
    actorId: userId,
    actorEmail: session.user.email,
    action: "draft.create",
    targetType: "chat",
    caseId,
    summary: `Drafted a ${typeLabel}`,
  });

  const prompt = `Case: ${caseRow.title}${caseRow.court ? ` (${caseRow.court})` : ""}

Case context from documents:
${contextBlock}

---
Task: Draft a ${typeLabel}.${instructions ? `\nAdditional instructions: ${instructions}` : ""}`;

  const contents: GeminiContent[] = [{ role: "user", parts: [{ text: prompt }] }];
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of streamGemini({ system: SYSTEM, contents })) {
          controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Draft generation failed.";
        controller.enqueue(encoder.encode(`⚠️ ${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
