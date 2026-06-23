/**
 * Stage 5.2.1 — серверные функции раздела «Заявки».
 * Защита: requireSupabaseAuth + проверка `has_admin_permission`.
 * После авторизации работаем через supabaseAdmin (RLS estimate_requests
 * допускает только роль 'admin', а нам нужны и project_manager/viewer и т.д.).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED_STATUSES = ["new", "in_review", "contacted", "quoted", "closed", "spam"] as const;
export type ApplicationStatus = (typeof ALLOWED_STATUSES)[number];

export interface ApplicationListItem {
  id: string;
  request_number: string;
  contact_name: string;
  phone: string | null;
  email: string | null;
  service_slug: string | null;
  source_path: string;
  status: ApplicationStatus;
  created_at: string;
  user_id: string | null;
}

export interface ApplicationDetail extends ApplicationListItem {
  submission_id: string;
  message: string | null;
  calculator_snapshot: Record<string, unknown> | null;
  calculator_mode: string | null;
  price_version: string | null;
  consent_version: string;
  consent_accepted_at: string;
  updated_at: string;
}

async function ensurePerm(context: { supabase: ReturnType<typeof Object> }, perm: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = context.supabase as any;
  const { data, error } = await sb.rpc("has_admin_permission", { _permission: perm });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("forbidden");
}

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status?: ApplicationStatus | "all"; search?: string; limit?: number; offset?: number }) => ({
    status: input?.status,
    search: typeof input?.search === "string" ? input.search.trim().slice(0, 200) : undefined,
    limit: Math.min(Math.max(input?.limit ?? 25, 1), 100),
    offset: Math.max(input?.offset ?? 0, 0),
  }))
  .handler(async ({ data, context }): Promise<{ items: ApplicationListItem[]; total: number }> => {
    await ensurePerm(context, "admin.applications.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("estimate_requests")
      .select(
        "id, request_number, contact_name, phone, email, service_slug, source_path, status, created_at, user_id",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.search) {
      const s = data.search.replace(/[%,]/g, "");
      q = q.or(`request_number.ilike.%${s}%,contact_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
    }
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { items: (rows ?? []) as ApplicationListItem[], total: count ?? 0 };
  });

export const getApplication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id || typeof input.id !== "string") throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<ApplicationDetail | null> => {
    await ensurePerm(context, "admin.applications.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("estimate_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as ApplicationDetail) ?? null;
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: ApplicationStatus; note?: string }) => {
    if (!input?.id) throw new Error("id_required");
    if (!ALLOWED_STATUSES.includes(input.status)) throw new Error("invalid_status");
    return { id: input.id, status: input.status, note: input.note?.slice(0, 500) ?? null };
  })
  .handler(async ({ data, context }): Promise<{ ok: true; status: ApplicationStatus }> => {
    await ensurePerm(context, "admin.applications.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev, error: readErr } = await supabaseAdmin
      .from("estimate_requests").select("status").eq("id", data.id).maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!prev) throw new Error("not_found");
    const { error } = await supabaseAdmin
      .from("estimate_requests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "application.status_change",
      entityType: "estimate_request",
      entityId: data.id,
      oldValue: { status: prev.status },
      newValue: { status: data.status },
      metadata: data.note ? { note: data.note } : null,
    });
    return { ok: true, status: data.status };
  });

export const convertApplicationToProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; title: string; description?: string }) => {
    if (!input?.id) throw new Error("id_required");
    const title = (input.title ?? "").trim();
    if (title.length < 3) throw new Error("title_too_short");
    return { id: input.id, title: title.slice(0, 200), description: input.description?.slice(0, 2000) ?? null };
  })
  .handler(async ({ data, context }): Promise<{ projectId: string }> => {
    await ensurePerm(context, "admin.applications.write");
    await ensurePerm(context, "admin.projects.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app, error: appErr } = await supabaseAdmin
      .from("estimate_requests").select("id, user_id, contact_name").eq("id", data.id).maybeSingle();
    if (appErr) throw new Error(appErr.message);
    if (!app) throw new Error("not_found");

    const { data: project, error: projErr } = await supabaseAdmin
      .from("projects")
      .insert({ title: data.title, description: data.description, status: "draft" })
      .select("id").single();
    if (projErr) throw new Error(projErr.message);

    if (app.user_id) {
      await supabaseAdmin
        .from("project_members")
        .upsert({ project_id: project.id, user_id: app.user_id, member_role: "client" }, { onConflict: "project_id,user_id" });
    }

    await supabaseAdmin.from("estimate_requests").update({ status: "quoted" }).eq("id", data.id);

    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "application.convert_to_project",
      entityType: "estimate_request",
      entityId: data.id,
      newValue: { project_id: project.id, title: data.title },
    });
    return { projectId: project.id };
  });