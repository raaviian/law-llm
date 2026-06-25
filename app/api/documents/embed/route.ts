import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCase } from "@/lib/data";
import { embedPendingChunks } from "@/lib/ingest";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Embed the next slice of pending chunks for a document. The client calls this
 * repeatedly (paced) until `done`, so large files finish over several minutes
 * without exceeding the embedding rate limit. Resumable — safe to re-call.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = (await req.json().catch(() => ({}))) as {
    documentId?: string;
  };
  if (!documentId) {
    return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
  }

  // Authorize: the caller must be able to access the document's case.
  const admin = createAdminClient();
  const { data: doc } = await admin
    .from("documents")
    .select("id, case_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const caseRow = await getCase(session.user.id, doc.case_id as string);
  if (!caseRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const progress = await embedPendingChunks(documentId);
    return NextResponse.json(progress);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Embedding failed";
    const rateLimited = /rate limit/i.test(message);
    // Rate-limited → keep the document resumable (don't mark failed); the client
    // backs off and retries. 503 signals "try again shortly".
    return NextResponse.json(
      { error: message, retry: rateLimited },
      { status: rateLimited ? 503 : 500 },
    );
  }
}
