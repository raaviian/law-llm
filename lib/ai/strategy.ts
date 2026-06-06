import "server-only";
import { generateGeminiJSON } from "@/lib/ai/gemini";

export interface GeneratedStrategy {
  objectives: string[];
  arguments: string[];
  risks: string[];
  timeline: string[];
}

/**
 * Draft a court strategy from retrieved case context. Returns four arrays of
 * concise bullet points (objectives incl. the main legal issues, arguments,
 * risks/counter-arguments, and a timeline). Null on failure.
 */
export async function generateCaseStrategy(opts: {
  caseTitle: string;
  court?: string | null;
  jurisdiction?: string | null;
  context: string;
}): Promise<GeneratedStrategy | null> {
  const system =
    "You are an experienced litigation strategist. Using ONLY the provided case context, produce a practical, court-ready strategy. Respond with ONLY JSON. Do not invent facts, parties, or authorities; if the context is thin, give sensible general strategic guidance and say so plainly.";

  const header = [
    opts.caseTitle,
    opts.court ? `— ${opts.court}` : "",
    opts.jurisdiction ? `(${opts.jurisdiction})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const prompt = `Case: ${header}

Case context from documents:
${opts.context}

Return a JSON object with these string arrays (each 3-6 concise bullets, under ~160 chars each):
- "objectives": the client's goals AND the pinpointed main legal issues/questions the court must decide.
- "arguments": the strongest arguments to advance, each with a brief factual or legal basis.
- "risks": key weaknesses, the opponent's likely counter-arguments, and evidentiary gaps.
- "timeline": a recommended sequence of steps/milestones leading to the hearing.
Base each point on the context where possible. Output JSON only.`;

  return generateGeminiJSON<GeneratedStrategy>({ system, prompt });
}
