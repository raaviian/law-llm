import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractPages } from "@/lib/ai/extract";
import { pagesToMarkdown } from "@/lib/ai/markdown";
import { chunkPages } from "@/lib/ai/chunk";
import { embedTexts } from "@/lib/ai/embeddings";
import { analyzeDocument } from "@/lib/ai/analyze";
import { getOrgAiConfig } from "@/lib/ai/llm";

// How many chunk rows to insert per DB round-trip (embedding batching/rate
// limiting is handled inside embedTexts).
const INSERT_BATCH = 100;

/**
 * Process an uploaded document end-to-end: download → extract text → chunk →
 * embed → store chunks. Runs with the admin client (trusted server worker).
 * Updates documents.status as it progresses so the UI can reflect state.
 */
export async function ingestDocument(documentId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: doc, error } = await admin
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single();
  if (error || !doc) throw new Error(`Document not found: ${documentId}`);

  await admin
    .from("documents")
    .update({ status: "processing", error: null })
    .eq("id", documentId);

  try {
    const { data: blob, error: dlErr } = await admin.storage
      .from("case-files")
      .download(doc.storage_path);
    if (dlErr || !blob) throw new Error(`Download failed: ${dlErr?.message}`);

    const buffer = Buffer.from(await blob.arrayBuffer());
    const rawPages = await extractPages(buffer, doc.mime_type ?? "", doc.file_name);
    // Normalize into compact markdown (de-hyphenate, drop running headers/
    // footers + page numbers, collapse whitespace) to cut embedding tokens.
    const pages = pagesToMarkdown(rawPages);
    const chunks = chunkPages(pages);

    if (chunks.length === 0) {
      throw new Error("No extractable text found in this file.");
    }

    // embedTexts batches + rate-limits internally; embed all chunks, then
    // insert the rows in DB-sized groups.
    const embeddings = await embedTexts(
      chunks.map((c) => c.content),
      "document",
    );
    for (let i = 0; i < chunks.length; i += INSERT_BATCH) {
      const rows = chunks.slice(i, i + INSERT_BATCH).map((c, j) => ({
        document_id: doc.id,
        case_id: doc.case_id,
        org_id: doc.org_id,
        content: c.content,
        page: c.page,
        chunk_index: c.index,
        tokens: c.tokens,
        embedding: embeddings[i + j] as unknown as string,
      }));
      const { error: insErr } = await admin.from("document_chunks").insert(rows);
      if (insErr) throw new Error(`Chunk insert failed: ${insErr.message}`);
    }

    // Auto-summary + key facts (non-fatal: a failure here still leaves the
    // document fully searchable/chattable).
    let summary: string | null = null;
    let keyFacts: Record<string, unknown> = {};
    try {
      const fullText = pages.map((p) => p.text).join("\n\n");
      const aiConfig = await getOrgAiConfig(doc.org_id);
      const analysis = await analyzeDocument(doc.file_name, fullText, aiConfig);
      if (analysis) {
        summary = analysis.summary || null;
        keyFacts = (analysis.key_facts ?? {}) as Record<string, unknown>;
      }
    } catch (err) {
      console.error("document analysis failed:", err);
    }

    await admin
      .from("documents")
      .update({
        status: "ready",
        page_count: pages.length,
        error: null,
        summary,
        key_facts: keyFacts,
      })
      .eq("id", documentId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingestion failed";
    await admin
      .from("documents")
      .update({ status: "failed", error: message })
      .eq("id", documentId);
    throw err;
  }
}
