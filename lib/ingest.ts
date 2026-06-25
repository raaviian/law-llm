import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractPages } from "@/lib/ai/extract";
import { pagesToMarkdown } from "@/lib/ai/markdown";
import { chunkPages } from "@/lib/ai/chunk";
import { embedTexts } from "@/lib/ai/embeddings";
import { analyzeDocument } from "@/lib/ai/analyze";
import { getOrgAiConfig } from "@/lib/ai/llm";

const INSERT_BATCH = 100;
// Tokens to embed per /api/documents/embed call. Small enough to stay inside a
// single safe Voyage request; the client paces calls to respect the per-minute
// limit, so a large document fills in over several minutes ("resumable").
const EMBED_SLICE_TOKENS = 2800;

export interface EmbedProgress {
  total: number;
  embedded: number;
  remaining: number;
  done: boolean;
}

/**
 * Phase 1 — fast, no embeddings. Download → extract → markdown → chunk → store
 * chunks WITHOUT embeddings, plus an AI summary. Leaves the document in
 * "processing"; embeddings are filled in incrementally by embedPendingChunks so
 * large files don't blow the embedding rate limit in one request.
 */
export async function prepareDocument(documentId: string): Promise<void> {
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
    // Compact markdown (de-hyphenate, drop running headers/footers + page
    // numbers, collapse whitespace) to cut embedding tokens.
    const pages = pagesToMarkdown(rawPages);
    const chunks = chunkPages(pages);
    if (chunks.length === 0) {
      throw new Error("No extractable text found in this file.");
    }

    // Store chunks without embeddings (embedding is nullable). Retrieval ignores
    // un-embedded chunks until embedPendingChunks fills them in.
    for (let i = 0; i < chunks.length; i += INSERT_BATCH) {
      const rows = chunks.slice(i, i + INSERT_BATCH).map((c) => ({
        document_id: doc.id,
        case_id: doc.case_id,
        org_id: doc.org_id,
        content: c.content,
        page: c.page,
        chunk_index: c.index,
        tokens: c.tokens,
      }));
      const { error: insErr } = await admin.from("document_chunks").insert(rows);
      if (insErr) throw new Error(`Chunk insert failed: ${insErr.message}`);
    }

    // Non-fatal AI summary + key facts.
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
      .update({ page_count: pages.length, error: null, summary, key_facts: keyFacts })
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

/**
 * Phase 2 — embed the next slice of pending chunks (those with a null
 * embedding) for a document, bounded by a token budget that fits one safe
 * request. Marks the document "ready" once nothing is left. Idempotent and
 * resumable: call it repeatedly (paced by the client) until `done`.
 */
export async function embedPendingChunks(documentId: string): Promise<EmbedProgress> {
  const admin = createAdminClient();

  const progress = async (): Promise<{ total: number; remaining: number }> => {
    const total = await admin
      .from("document_chunks")
      .select("id", { count: "exact", head: true })
      .eq("document_id", documentId);
    const remaining = await admin
      .from("document_chunks")
      .select("id", { count: "exact", head: true })
      .eq("document_id", documentId)
      .is("embedding", null);
    return { total: total.count ?? 0, remaining: remaining.count ?? 0 };
  };

  // Pull the next pending chunks (ordered) and take a token-bounded slice.
  const { data: pending } = await admin
    .from("document_chunks")
    .select("id, content, tokens")
    .eq("document_id", documentId)
    .is("embedding", null)
    .order("chunk_index", { ascending: true })
    .limit(64);

  if (!pending || pending.length === 0) {
    const { total } = await progress();
    await admin
      .from("documents")
      .update({ status: "ready", error: null })
      .eq("id", documentId);
    return { total, embedded: 0, remaining: 0, done: true };
  }

  const slice: typeof pending = [];
  let budget = 0;
  for (const c of pending) {
    const t = (c.tokens as number) ?? Math.ceil((c.content as string).length / 4);
    if (slice.length && budget + t > EMBED_SLICE_TOKENS) break;
    slice.push(c);
    budget += t;
  }

  const embeddings = await embedTexts(
    slice.map((c) => c.content as string),
    "document",
  );
  for (let i = 0; i < slice.length; i++) {
    const { error: upErr } = await admin
      .from("document_chunks")
      .update({ embedding: embeddings[i] as unknown as string })
      .eq("id", slice[i].id as string);
    if (upErr) throw new Error(`Embedding update failed: ${upErr.message}`);
  }

  const { total, remaining } = await progress();
  const done = remaining === 0;
  if (done) {
    await admin
      .from("documents")
      .update({ status: "ready", error: null })
      .eq("id", documentId);
  }
  return { total, embedded: slice.length, remaining, done };
}
