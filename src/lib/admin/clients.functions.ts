/**
 * Stage 5.2.1 — серверные функции раздела «Клиенты».
 * Защита: requireSupabaseAuth + has_admin_permission.
 * Чтение PII (email/phone) требует отдельного permission `admin.clients.pii`.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ClientListItem {
  id: string;
  display_name: string | null;
  phone: string | null;
  email: string | null;
  roles: string[];
  projects_count: number;
  applications_count: number;
  created_at: string;
}

export interface ClientDetail {
  id: string;
  display_name: string | null;
  phone: string | null;
  email: string | null;
  roles: string[];
  created_at: string;
  updated_at: string;
  applications: Array<{ id: string; request_number: string; status: string; created_at: string }>;
  projects: Array<{ id: string; title: string; status: string; created_at: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensurePerm(context: { supabase: any }, perm: string) {
  const { data, error } = await context.supabase.rpc("has_admin_permission", { _permission: perm });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("forbidden");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function hasPerm(context: { supabase: any }, perm: string): Promise<boolean> {
  const { data } = await context.supabase.rpc("has_admin_permission", { _permission: perm });
  return !!data;
}

export const listClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string; limit?: number; offset?: number }) => ({
    search: typeof input?.search === "string" ? input.search.trim().slice(0, 200) : undefined,
    limit: Math.min(Math.max(input?.limit ?? 25, 1), 100),
    offset: Math.max(input?.offset ?? 0, 0),
  }))
  .handler(async ({ data, context }): Promise<{ items: ClientListItem[]; total: number }> => {
    await ensurePerm(context, "admin.clients.read");
    const canPii = await hasPerm(context, "admin.clients.pii");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let pq = supabaseAdmin.from("profiles")
      .select("id, display_name, phone, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.search) {
      const s = data.search.replace(/[%,]/g, "");
      pq = pq.or(`display_name.ilike.%${s}%,phone.ilike.%${s}%`);
    }
    const { data: profiles, error, count } = await pq;
    if (error) throw new Error(error.message);
    const ids = (profiles ?? []).map((p) => p.id);
    if (ids.length === 0) return { items: [], total: count ?? 0 };

    const [rolesRes, projRes, appsRes] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
      supabaseAdmin.from("project_members").select("user_id, project_id").in("user_id", ids),
      supabaseAdmin.from("estimate_requests").select("user_id").in("user_id", ids),
    ]);

    const rolesByUser = new Map<string, string[]>();
    (rolesRes.data ?? []).forEach((r) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role as string);
      rolesByUser.set(r.user_id, arr);
    });
    const projCount = new Map<string, number>();
    (projRes.data ?? []).forEach((r) => projCount.set(r.user_id, (projCount.get(r.user_id) ?? 0) + 1));
    const appCount = new Map<string, number>();
    (appsRes.data ?? []).forEach((r) => {
      if (r.user_id) appCount.set(r.user_id, (appCount.get(r.user_id) ?? 0) + 1);
    });

    // Email — только из auth.users и только если есть admin.clients.pii.
    const emails = new Map<string, string | null>();
    if (canPii) {
      await Promise.all(ids.map(async (uid) => {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(uid);
        emails.set(uid, u?.user?.email ?? null);
      }));
    }

    const items: ClientListItem[] = (profiles ?? []).map((p) => ({
      id: p.id,
      display_name: p.display_name,
      phone: canPii ? p.phone : maskPhone(p.phone),
      email: canPii ? (emails.get(p.id) ?? null) : null,
      roles: rolesByUser.get(p.id) ?? [],
      projects_count: projCount.get(p.id) ?? 0,
      applications_count: appCount.get(p.id) ?? 0,
      created_at: p.created_at,
    }));
    return { items, total: count ?? 0 };
  });

function maskPhone(p: string | null): string | null {
  if (!p) return p;
  if (p.length <= 4) return "***";
  return p.slice(0, 2) + "***" + p.slice(-2);
}

export const getClient = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<ClientDetail | null> => {
    await ensurePerm(context, "admin.clients.read");
    const canPii = await hasPerm(context, "admin.clients.pii");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error } = await supabaseAdmin
      .from("profiles").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) return null;

    const [rolesRes, appsRes, projRes, userRes] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", data.id),
      supabaseAdmin.from("estimate_requests").select("id, request_number, status, created_at")
        .eq("user_id", data.id).order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("project_members").select("project_id, projects(id, title, status, created_at)")
        .eq("user_id", data.id),
      canPii ? supabaseAdmin.auth.admin.getUserById(data.id) : Promise.resolve({ data: null }),
    ]);

    const projects = (projRes.data ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => r.projects)
      .filter(Boolean)
      .map((p: { id: string; title: string; status: string; created_at: string }) => p);

    return {
      id: profile.id,
      display_name: profile.display_name,
      phone: canPii ? profile.phone : maskPhone(profile.phone),
      email: canPii ? (userRes.data?.user?.email ?? null) : null,
      roles: (rolesRes.data ?? []).map((r) => r.role as string),
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      applications: (appsRes.data ?? []) as ClientDetail["applications"],
      projects: projects as ClientDetail["projects"],
    };
  });

export const updateClientProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; display_name?: string | null; phone?: string | null }) => {
    if (!input?.id) throw new Error("id_required");
    return {
      id: input.id,
      display_name: input.display_name === undefined ? undefined : (input.display_name?.slice(0, 200) ?? null),
      phone: input.phone === undefined ? undefined : (input.phone?.slice(0, 50) ?? null),
    };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.clients.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: { display_name?: string | null; phone?: string | null } = {};
    if (data.display_name !== undefined) patch.display_name = data.display_name;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { data: prev } = await supabaseAdmin.from("profiles")
      .select("display_name, phone").eq("id", data.id).maybeSingle();
    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "client.update_profile",
      entityType: "profile",
      entityId: data.id,
      oldValue: prev ? { display_name: prev.display_name, phone: prev.phone } : null,
      newValue: patch as { [k: string]: string | null },
    });
    return { ok: true };
  });