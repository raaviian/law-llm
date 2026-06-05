import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditEntry {
  orgId: string;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string; // e.g. "case.create", "document.view"
  targetType?: string;
  targetId?: string | null;
  caseId?: string | null;
  summary?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append an entry to the audit log. Best-effort: failures are logged but never
 * thrown, so auditing can't break the user-facing action it records.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      org_id: entry.orgId,
      actor_id: entry.actorId ?? null,
      actor_email: entry.actorEmail ?? null,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      case_id: entry.caseId ?? null,
      summary: entry.summary ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch (err) {
    console.error("audit log write failed:", err);
  }
}
