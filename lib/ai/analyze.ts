import "server-only";
import { generateGeminiJSON } from "@/lib/ai/gemini";

export interface DocKeyFacts {
  parties?: string[];
  key_dates?: { date: string; event: string }[];
  obligations?: string[];
  amounts?: string[];
}

export interface DocAnalysis {
  summary: string;
  key_facts: DocKeyFacts;
}

/**
 * Summarize a document and extract structured key facts using Gemini. Returns
 * null if analysis fails (callers treat this as non-fatal).
 */
export async function analyzeDocument(
  fileName: string,
  text: string,
): Promise<DocAnalysis | null> {
  const excerpt = text.slice(0, 24000); // cap tokens; covers most matters
  const system =
    "You are a meticulous legal assistant. Analyze the document and respond with ONLY JSON. Use only facts present in the text.";
  const prompt = `Analyze this legal document titled "${fileName}" and return JSON with these keys:
- "summary": a 2-3 sentence plain-English summary.
- "parties": array of party names or roles mentioned.
- "key_dates": array of objects {"date": string, "event": string}.
- "obligations": array of short strings describing who must do what.
- "amounts": array of strings for monetary amounts with brief context.
Use empty arrays where nothing applies. Do not invent information.

Document text:
"""
${excerpt}
"""`;

  const result = await generateGeminiJSON<{ summary?: string } & DocKeyFacts>({
    system,
    prompt,
  });
  if (!result) return null;
  return {
    summary: result.summary ?? "",
    key_facts: {
      parties: result.parties ?? [],
      key_dates: result.key_dates ?? [],
      obligations: result.obligations ?? [],
      amounts: result.amounts ?? [],
    },
  };
}
