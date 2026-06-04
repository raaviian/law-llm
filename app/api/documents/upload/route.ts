import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCase } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestDocument } from "@/lib/ingest";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const caseId = String(form.get("caseId") ?? "");

  if (!(file instanceof File) || !caseId) {
    return NextResponse.json({ error: "Missing file or caseId" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File exceeds the 25 MB limit." },
      { status: 413 },
    );
  }

  // Verify the caller owns this case (RLS-scoped read).
  const caseRow = await getCase(session.user.id, caseId);
  if (!caseRow) {
    return NextResponse.json({ error: "Case not found" }, { status: 403 });
  }

  const admin = createAdminClient();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const storagePath = `${caseRow.org_id}/${caseId}/${crypto.randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from("case-files")
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: doc, error: insErr } = await admin
    .from("documents")
    .insert({
      case_id: caseId,
      org_id: caseRow.org_id,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type || null,
      size: file.size,
      status: "uploaded",
      uploaded_by: session.user.id,
    })
    .select("id")
    .single();
  if (insErr || !doc) {
    return NextResponse.json(
      { error: insErr?.message ?? "Insert failed" },
      { status: 500 },
    );
  }

  // Ingest inline (MVP). For large files, move this to a background queue.
  try {
    await ingestDocument(doc.id);
  } catch {
    // Status is already marked "failed" inside ingestDocument; surface 200 so
    // the UI can show the per-document error state.
  }

  return NextResponse.json({ id: doc.id });
}
