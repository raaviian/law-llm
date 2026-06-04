import "server-only";
import { createUserClient } from "@/lib/supabase/server";
import { embedQuery } from "@/lib/ai/embeddings";

export interface RetrievedChunk {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  page: number | null;
  similarity: number;
}

/**
 * Retrieve the most relevant chunks for a question within a single case,
 * enriched with document file names for citations.
 */
export async function retrieveContext(
  userId: string,
  caseId: string,
  query: string,
  matchCount = 8,
): Promise<RetrievedChunk[]> {
  const supabase = await createUserClient(userId);
  const embedding = await embedQuery(query);

  const { data, error } = await supabase.rpc("match_document_chunks", {
    p_case_id: caseId,
    query_embedding: embedding as unknown as string,
    match_count: matchCount,
  });
  if (error) throw new Error(`Retrieval failed: ${error.message}`);

  const rows = (data ?? []) as {
    id: string;
    document_id: string;
    content: string;
    page: number | null;
    similarity: number;
  }[];

  // Resolve document names in one query.
  const docIds = [...new Set(rows.map((r) => r.document_id))];
  const nameById = new Map<string, string>();
  if (docIds.length) {
    const { data: docs } = await supabase
      .from("documents")
      .select("id, file_name")
      .in("id", docIds);
    for (const d of docs ?? []) nameById.set(d.id, d.file_name);
  }

  return rows.map((r) => ({
    id: r.id,
    documentId: r.document_id,
    documentName: nameById.get(r.document_id) ?? "Document",
    content: r.content,
    page: r.page,
    similarity: r.similarity,
  }));
}

export const SYSTEM_PROMPT = `You are LexBoard's legal research assistant. You help a lawyer understand the documents of a specific case.

Rules:
- Answer ONLY using the provided case document excerpts ("Context"). Do not rely on outside knowledge of this matter.
- If the answer is not contained in the context, say so plainly and suggest what document might contain it.
- Cite your sources inline using the bracketed labels shown with each excerpt, e.g. [1], [2]. Cite after each claim that relies on a source.
- Be precise and concise. Use the language the lawyer writes in.
- You are not a substitute for professional legal judgment; do not give a final legal opinion or guarantee outcomes.`;

/** Format retrieved chunks into a numbered context block for the prompt. */
export function buildContextBlock(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "No relevant excerpts were found in the case documents.";
  return chunks
    .map((c, i) => {
      const loc = c.page ? `${c.documentName}, p.${c.page}` : c.documentName;
      return `[${i + 1}] (${loc})\n${c.content}`;
    })
    .join("\n\n---\n\n");
}
