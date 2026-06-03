import "server-only";
import { env, requireEnv } from "@/lib/env";

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";

type InputType = "document" | "query";

interface VoyageResponse {
  data: { embedding: number[]; index: number }[];
}

/**
 * Embed one or more texts with Voyage AI (voyage-law-2, 1024 dims). Use
 * input_type "document" when indexing chunks and "query" when embedding a
 * user question — this asymmetry improves retrieval quality.
 */
export async function embedTexts(
  texts: string[],
  inputType: InputType,
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const key = requireEnv(env.voyageKey, "VOYAGE_API_KEY");

  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: texts,
      model: env.voyageModel,
      input_type: inputType,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Voyage embeddings failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as VoyageResponse;
  return json.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text], "query");
  return embedding;
}
