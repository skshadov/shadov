/**
 * Stage 5.2.2 — серверные функции раздела «Проекты, этапы, приёмки».
 * Защита: requireSupabaseAuth + has_admin_permission.
 * После авторизации работаем через supabaseAdmin, чтобы менеджеры могли
 * читать/писать данные независимо от своего членства в project_members.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PROJECT_STATUSES = ["draft", "planning", "in_progress", "on_hold", "completed", "cancelled"] as const;
const STAGE_STATUSES = ["pending", "in_progress", "review", "accepted", "blocked"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type StageStatus = (typeof STAGE_STATUSES)[number];

export interface ProjectListItem {
  id: string;
  title: string;
  status: ProjectStatus;
  is_demo: boolean;
  created_at: string;
  members_count: number;
  stages_count: number;
}

export interface ProjectDetail {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  members: Array<{ user_id: string; member_role: string; display_name: string | null }>;
  stages: Array<{
    id: string; title: string; description: string | null; status: StageStatus;
    sort_order: number; planned_start: string | null; planned_end: string | null;
    actual_start: string | null; actual_end: string | null;
  }>;
  acceptances: Array<{
    id: string; stage_id: string; status: string; attempt_number: number;
    requested_at: string; responded_at: string | null; client_comment: string | null;
  }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensurePerm(context: { supabase: any }, perm: string) {
  const { data, error } = await context.supabase.rpc("has_admin_permission", { _permission: perm });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("forbidden");
}

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status?: ProjectStatus | "all"; search?: string; limit?: number; offset?: number }) => ({
    status: input?.status,
    search: typeof input?.search === "string" ? input.search.trim().slice(0, 200) : undefined,
    limit: Math.min(Math.max(input?.limit ?? 25, 1), 100),
    offset: Math.max(input?.offset ?? 0, 0),
  }))
  .handler(async ({ data, context }): Promise<{ items: ProjectListItem[]; total: number }> => {
    await ensurePerm(context, "admin.projects.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("projects")
      .select("id, title, status, is_demo, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.search) {
      const s = data.search.replace(/[%,]/g, "");
      q = q.ilike("title", `%${s}%`);
    }
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((r) => r.id);
    const [mRes, sRes] = await Promise.all([
      ids.length ? supabaseAdmin.from("project_members").select("project_id").in("project_id", ids) : Promise.resolve({ data: [] }),
      ids.length ? supabaseAdmin.from("project_stages").select("project_id").in("project_id", ids) : Promise.resolve({ data: [] }),
    ]);
    const mc = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mRes.data ?? []).forEach((r: any) => mc.set(r.project_id, (mc.get(r.project_id) ?? 0) + 1));
    const sc = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sRes.data ?? []).forEach((r: any) => sc.set(r.project_id, (sc.get(r.project_id) ?? 0) + 1));
    const items: ProjectListItem[] = (rows ?? []).map((r) => ({
      id: r.id, title: r.title, status: r.status as ProjectStatus, is_demo: r.is_demo,
      created_at: r.created_at,
      members_count: mc.get(r.id) ?? 0,
      stages_count: sc.get(r.id) ?? 0,
    }));
    return { items, total: count ?? 0 };
  });

export const getProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<ProjectDetail | null> => {
    await ensurePerm(context, "admin.projects.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: project, error } = await supabaseAdmin.from("projects")
      .select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) return null;

    const [mRes, sRes, aRes] = await Promise.all([
      supabaseAdmin.from("project_members")
        .select("user_id, member_role, profiles:profiles!project_members_user_id_fkey(display_name)")
        .eq("project_id", data.id),
      supabaseAdmin.from("project_stages")
        .select("*").eq("project_id", data.id).order("sort_order", { ascending: true }),
      supabaseAdmin.from("project_stage_acceptances")
        .select("id, stage_id, status, attempt_number, requested_at, responded_at, client_comment")
        .in("stage_id", []),
    ]);

    const stages = (sRes.data ?? []) as ProjectDetail["stages"];
    let acceptances: ProjectDetail["acceptances"] = [];
    if (stages.length) {
      const { data: ac } = await supabaseAdmin
        .from("project_stage_acceptances")
        .select("id, stage_id, status, attempt_number, requested_at, responded_at, client_comment")
        .in("stage_id", stages.map((s) => s.id))
        .order("requested_at", { ascending: false });
      acceptances = (ac ?? []) as ProjectDetail["acceptances"];
    }
    void aRes;

    return {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status as ProjectStatus,
      is_demo: project.is_demo,
      created_at: project.created_at,
      updated_at: project.updated_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      members: ((mRes.data ?? []) as any[]).map((r) => ({
        user_id: r.user_id, member_role: r.member_role,
        display_name: r.profiles?.display_name ?? null,
      })),
      stages,
      acceptances,
    };
  });

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; title?: string; description?: string | null; status?: ProjectStatus }) => {
    if (!input?.id) throw new Error("id_required");
    if (input.status && !PROJECT_STATUSES.includes(input.status)) throw new Error("invalid_status");
    return {
      id: input.id,
      title: input.title?.trim().slice(0, 200),
      description: input.description === undefined ? undefined : (input.description?.slice(0, 5000) ?? null),
      status: input.status,
    };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.projects.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.title) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.status) patch.status = data.status;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { data: prev } = await supabaseAdmin.from("projects")
      .select("title, description, status").eq("id", data.id).maybeSingle();
    const { error } = await supabaseAdmin.from("projects").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "project.update",
      entityType: "project",
      entityId: data.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      oldValue: (prev ?? null) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newValue: patch as any,
    });
    return { ok: true };
  });

export const upsertStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    id?: string; project_id: string; title: string; description?: string | null;
    status?: StageStatus; sort_order?: number;
    planned_start?: string | null; planned_end?: string | null;
  }) => {
    if (!input?.project_id) throw new Error("project_required");
    const title = (input.title ?? "").trim();
    if (title.length < 2) throw new Error("title_too_short");
    if (input.status && !STAGE_STATUSES.includes(input.status)) throw new Error("invalid_status");
    return {
      id: input.id,
      project_id: input.project_id,
      title: title.slice(0, 200),
      description: input.description === undefined ? null : (input.description?.slice(0, 4000) ?? null),
      status: input.status ?? "pending",
      sort_order: Math.max(0, Math.min(input.sort_order ?? 0, 9999)),
      planned_start: input.planned_start ?? null,
      planned_end: input.planned_end ?? null,
    };
  })
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await ensurePerm(context, "admin.projects.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin.from("project_stages").update({
        title: data.title, description: data.description, status: data.status,
        sort_order: data.sort_order, planned_start: data.planned_start, planned_end: data.planned_end,
      }).eq("id", data.id);
      if (error) throw new Error(error.message);
      const { logAdminAction } = await import("./audit.server");
      await logAdminAction({
        actorUserId: context.userId, action: "stage.update",
        entityType: "project_stage", entityId: data.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newValue: data as any,
      });
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin.from("project_stages").insert({
      project_id: data.project_id, title: data.title, description: data.description,
      status: data.status, sort_order: data.sort_order,
      planned_start: data.planned_start, planned_end: data.planned_end,
    }).select("id").single();
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId, action: "stage.create",
      entityType: "project_stage", entityId: row.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newValue: data as any,
    });
    return { id: row.id };
  });

export const deleteStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.projects.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("project_stages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId, action: "stage.delete",
      entityType: "project_stage", entityId: data.id,
    });
    return { ok: true };
  });

export const requestStageAcceptance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { stage_id: string }) => {
    if (!input?.stage_id) throw new Error("stage_required");
    return { stage_id: input.stage_id };
  })
  .handler(async ({ data, context }): Promise<{ id: string; attempt_number: number }> => {
    await ensurePerm(context, "admin.projects.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await supabaseAdmin.from("project_stage_acceptances")
      .select("attempt_number").eq("stage_id", data.stage_id)
      .order("attempt_number", { ascending: false }).limit(1).maybeSingle();
    const attempt = (prev?.attempt_number ?? 0) + 1;
    const { data: row, error } = await supabaseAdmin.from("project_stage_acceptances").insert({
      stage_id: data.stage_id, status: "pending", attempt_number: attempt,
      requested_by: context.userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("project_stages").update({ status: "review" }).eq("id", data.stage_id);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId, action: "stage.request_acceptance",
      entityType: "project_stage", entityId: data.stage_id,
      newValue: { acceptance_id: row.id, attempt_number: attempt },
    });
    return { id: row.id, attempt_number: attempt };
  });