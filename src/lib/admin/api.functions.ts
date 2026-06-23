/**
 * Stage 5.1 — серверные функции административной панели.
 *
 * Все вызовы защищены `requireSupabaseAuth`, проверка роли — только через
 * безопасные SECURITY DEFINER функции в БД (`has_admin_permission`,
 * `get_my_admin_permissions`, `is_admin_user`). Никакого доверия к клиенту.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AdminContext {
  userId: string;
  email: string | null;
  role: string | null;
  permissions: string[];
}

/** Возвращает контекст администратора текущего пользователя или null. */
export const getMyAdminContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminContext | null> => {
    const { supabase, userId } = context;

    const [{ data: isAdmin, error: isAdminErr }, { data: rows, error: permErr }, { data: role }] =
      await Promise.all([
        supabase.rpc("is_admin_user"),
        supabase.rpc("get_my_admin_permissions"),
        supabase.rpc("get_my_primary_role"),
      ]);

    if (isAdminErr || permErr) {
      throw new Error(isAdminErr?.message || permErr?.message || "rpc_failed");
    }
    if (!isAdmin) return null;

    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email ?? null;

    const permissions = Array.isArray(rows)
      ? rows.map((r: { permission_key: string }) => r.permission_key)
      : [];

    return { userId, email, role: (role as string | null) ?? null, permissions };
  });

export interface DashboardCounters {
  newApplications: number;
  activeProjects: number;
  pendingAcceptances: number;
  unreadMessages: number;
  unpaidPayments: number;
  recentReports: number;
  recentAuditEntries: number;
}

/** Сводные счётчики дашборда. Только для пользователей с правом admin.dashboard.read. */
export const getDashboardCounters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardCounters> => {
    const { supabase } = context;

    const { data: allowed, error: permErr } = await supabase.rpc("has_admin_permission", {
      _permission: "admin.dashboard.read",
    });
    if (permErr) throw new Error(permErr.message);
    if (!allowed) throw new Error("forbidden");

    // Все запросы выполняются под RLS пользователя; для счётчиков используем head:true + count.
    const sinceISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [apps, projects, acceptances, messages, payments, reports, audit] = await Promise.all([
      supabase.from("estimate_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("project_stage_acceptances").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("project_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
      supabase.from("project_payments").select("id", { count: "exact", head: true }).in("status", ["planned", "invoice_issued", "pending", "overdue"]),
      supabase.from("project_daily_reports").select("id", { count: "exact", head: true }).gte("created_at", sinceISO),
      supabase.from("admin_audit_log").select("id", { count: "exact", head: true }).gte("created_at", sinceISO),
    ]);

    return {
      newApplications: apps.count ?? 0,
      activeProjects: projects.count ?? 0,
      pendingAcceptances: acceptances.count ?? 0,
      unreadMessages: messages.count ?? 0,
      unpaidPayments: payments.count ?? 0,
      recentReports: reports.count ?? 0,
      recentAuditEntries: audit.count ?? 0,
    };
  });