/**
 * Stage 5.2 — серверный помощник записи в admin_audit_log.
 * Только server-only: использует supabaseAdmin (service_role) для записи,
 * минуя RLS на запись (на таблице есть только SELECT-политика).
 * Импортировать только из *.functions.ts через динамический import().
 */
import type { Database } from "@/integrations/supabase/types";

type Json = Database["public"]["Tables"]["admin_audit_log"]["Row"]["metadata"];

export interface AuditEntry {
  actorUserId: string;
  actorRole?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  oldValue?: Json | null;
  newValue?: Json | null;
  metadata?: Json | null;
  result?: "success" | "denied" | "error";
}

export async function logAdminAction(entry: AuditEntry): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("admin_audit_log").insert({
    actor_user_id: entry.actorUserId,
    actor_role: (entry.actorRole as Database["public"]["Enums"]["app_role"] | null) ?? null,
    action: entry.action,
    entity_type: entry.entityType ?? null,
    entity_id: entry.entityId ?? null,
    old_value: entry.oldValue ?? null,
    new_value: entry.newValue ?? null,
    metadata: entry.metadata ?? null,
    result: entry.result ?? "success",
  });
}