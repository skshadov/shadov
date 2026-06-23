/**
 * Stage 5.2.4 — серверные функции: сообщения, платежи и камеры проекта.
 * Защита: requireSupabaseAuth + has_admin_permission.
 * После авторизации работаем через supabaseAdmin, чтобы менеджеры могли
 * управлять проектами вне зависимости от членства в project_members.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ===================== shared ===================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensurePerm(context: { supabase: any }, perm: string) {
  const { data, error } = await context.supabase.rpc("has_admin_permission", { _permission: perm });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("forbidden");
}

/* ===================== MESSAGES ===================== */

export interface MessageItem {
  id: string;
  project_id: string;
  sender_id: string | null;
  sender_name: string | null;
  message_type: string;
  body: string;
  created_at: string;
}

const ALLOWED_MESSAGE_TYPES = ["text", "system", "milestone"] as const;

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { project_id: string; limit?: number }) => {
    if (!input?.project_id) throw new Error("project_required");
    return { project_id: input.project_id, limit: Math.min(Math.max(input.limit ?? 200, 1), 500) };
  })
  .handler(async ({ data, context }): Promise<MessageItem[]> => {
    await ensurePerm(context, "admin.messages.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("project_messages")
      .select("id, project_id, sender_id, message_type, body, created_at")
      .eq("project_id", data.project_id)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    const ids = Array.from(new Set((rows ?? []).map((r) => r.sender_id).filter((x): x is string => !!x)));
    const names = new Map<string, string | null>();
    if (ids.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, display_name").in("id", ids);
      (profs ?? []).forEach((p) => names.set(p.id, p.display_name ?? null));
    }
    return (rows ?? []).map((r) => ({
      id: r.id, project_id: r.project_id, sender_id: r.sender_id,
      sender_name: r.sender_id ? (names.get(r.sender_id) ?? null) : null,
      message_type: r.message_type, body: r.body, created_at: r.created_at,
    }));
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { project_id: string; body: string; message_type?: string }) => {
    if (!input?.project_id) throw new Error("project_required");
    const body = (input.body ?? "").trim();
    if (body.length < 1) throw new Error("body_required");
    if (body.length > 4000) throw new Error("body_too_long");
    const mt = input.message_type ?? "text";
    if (!ALLOWED_MESSAGE_TYPES.includes(mt as (typeof ALLOWED_MESSAGE_TYPES)[number])) throw new Error("invalid_type");
    return { project_id: input.project_id, body, message_type: mt };
  })
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await ensurePerm(context, "admin.messages.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("project_messages")
      .insert({ project_id: data.project_id, sender_id: context.userId, body: data.body, message_type: data.message_type })
      .select("id").single();
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId, action: "message.send",
      entityType: "project_message", entityId: row.id,
      newValue: { project_id: data.project_id, message_type: data.message_type, length: data.body.length },
    });
    return { id: row.id };
  });

export const deleteMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.messages.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("project_messages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId, action: "message.delete",
      entityType: "project_message", entityId: data.id,
    });
    return { ok: true };
  });

/* ===================== PAYMENTS ===================== */

const ALLOWED_PAYMENT_STATUSES = ["draft", "pending", "invoiced", "paid", "overdue", "cancelled"] as const;
export type PaymentStatus = (typeof ALLOWED_PAYMENT_STATUSES)[number];

export interface PaymentItem {
  id: string;
  project_id: string;
  stage_id: string | null;
  stage_title: string | null;
  title: string;
  description: string | null;
  amount: number | null;
  currency: string;
  status: PaymentStatus;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

export const listPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { project_id: string }) => {
    if (!input?.project_id) throw new Error("project_required");
    return { project_id: input.project_id };
  })
  .handler(async ({ data, context }): Promise<PaymentItem[]> => {
    await ensurePerm(context, "admin.payments.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("project_payments")
      .select("*, project_stages(title)")
      .eq("project_id", data.project_id)
      .order("due_date", { ascending: true, nullsFirst: false });
    if (error) throw new Error(error.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((rows ?? []) as any[]).map((r) => ({
      id: r.id, project_id: r.project_id, stage_id: r.stage_id,
      stage_title: r.project_stages?.title ?? null,
      title: r.title, description: r.description,
      amount: r.amount === null ? null : Number(r.amount),
      currency: r.currency, status: r.status as PaymentStatus,
      due_date: r.due_date, paid_at: r.paid_at, created_at: r.created_at,
    }));
  });

export const upsertPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    id?: string; project_id: string; stage_id?: string | null;
    title: string; description?: string | null;
    amount?: number | null; currency?: string; status?: PaymentStatus;
    due_date?: string | null; paid_at?: string | null;
  }) => {
    if (!input?.project_id) throw new Error("project_required");
    const title = (input.title ?? "").trim();
    if (title.length < 2) throw new Error("title_too_short");
    if (input.status && !ALLOWED_PAYMENT_STATUSES.includes(input.status)) throw new Error("invalid_status");
    if (input.amount !== undefined && input.amount !== null && (!Number.isFinite(input.amount) || input.amount < 0)) throw new Error("amount_invalid");
    return {
      id: input.id,
      project_id: input.project_id,
      stage_id: input.stage_id ?? null,
      title: title.slice(0, 200),
      description: input.description?.slice(0, 2000) ?? null,
      amount: input.amount ?? null,
      currency: (input.currency || "RUB").slice(0, 3).toUpperCase(),
      status: input.status ?? "draft",
      due_date: input.due_date ?? null,
      paid_at: input.paid_at ?? null,
    };
  })
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await ensurePerm(context, "admin.payments.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      project_id: data.project_id, stage_id: data.stage_id,
      title: data.title, description: data.description,
      amount: data.amount, currency: data.currency, status: data.status,
      due_date: data.due_date,
      paid_at: data.status === "paid" ? (data.paid_at ?? new Date().toISOString()) : null,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("project_payments").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      const { logAdminAction } = await import("./audit.server");
      await logAdminAction({
        actorUserId: context.userId, action: "payment.update",
        entityType: "project_payment", entityId: data.id,
        newValue: { status: data.status, amount: data.amount, currency: data.currency },
      });
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("project_payments").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId, action: "payment.create",
      entityType: "project_payment", entityId: row.id,
      newValue: { project_id: data.project_id, status: data.status, amount: data.amount, currency: data.currency },
    });
    return { id: row.id };
  });

export const deletePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.payments.delete");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("project_payments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId, action: "payment.delete",
      entityType: "project_payment", entityId: data.id,
    });
    return { ok: true };
  });

/* ===================== CAMERAS ===================== */

const CAMERA_STATUSES = ["active", "paused", "offline", "archived"] as const;
export type CameraStatus = (typeof CAMERA_STATUSES)[number];

export interface CameraItem {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: CameraStatus;
  sort_order: number;
  last_checked_at: string | null;
  provider: string | null;
  provider_camera_id: string | null;
  configuration_reference: string | null;
}

export const listCameras = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { project_id: string }) => {
    if (!input?.project_id) throw new Error("project_required");
    return { project_id: input.project_id };
  })
  .handler(async ({ data, context }): Promise<CameraItem[]> => {
    await ensurePerm(context, "admin.cameras.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("project_cameras")
      .select("*, project_camera_sources(provider, provider_camera_id, configuration_reference)")
      .eq("project_id", data.project_id)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((rows ?? []) as any[]).map((r) => {
      const src = Array.isArray(r.project_camera_sources) ? r.project_camera_sources[0] : r.project_camera_sources;
      return {
        id: r.id, project_id: r.project_id, name: r.name, description: r.description,
        status: r.status as CameraStatus, sort_order: r.sort_order, last_checked_at: r.last_checked_at,
        provider: src?.provider ?? null,
        provider_camera_id: src?.provider_camera_id ?? null,
        configuration_reference: src?.configuration_reference ?? null,
      };
    });
  });

export const upsertCamera = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    id?: string; project_id: string; name: string; description?: string | null;
    status?: CameraStatus; sort_order?: number;
  }) => {
    if (!input?.project_id) throw new Error("project_required");
    const name = (input.name ?? "").trim();
    if (name.length < 2) throw new Error("name_too_short");
    if (input.status && !CAMERA_STATUSES.includes(input.status)) throw new Error("invalid_status");
    return {
      id: input.id, project_id: input.project_id,
      name: name.slice(0, 200),
      description: input.description?.slice(0, 2000) ?? null,
      status: input.status ?? "active",
      sort_order: Math.max(0, Math.min(input.sort_order ?? 0, 9999)),
    };
  })
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await ensurePerm(context, "admin.cameras.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin.from("project_cameras")
        .update({ name: data.name, description: data.description, status: data.status, sort_order: data.sort_order })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      const { logAdminAction } = await import("./audit.server");
      await logAdminAction({
        actorUserId: context.userId, action: "camera.update",
        entityType: "project_camera", entityId: data.id,
        newValue: { name: data.name, status: data.status },
      });
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin.from("project_cameras").insert({
      project_id: data.project_id, name: data.name, description: data.description,
      status: data.status, sort_order: data.sort_order,
    }).select("id").single();
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId, action: "camera.create",
      entityType: "project_camera", entityId: row.id,
      newValue: { project_id: data.project_id, name: data.name },
    });
    return { id: row.id };
  });

export const deleteCamera = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.cameras.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("project_cameras").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId, action: "camera.delete",
      entityType: "project_camera", entityId: data.id,
    });
    return { ok: true };
  });

export const configureCameraSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { camera_id: string; provider: string; provider_camera_id: string; configuration_reference?: string | null }) => {
    if (!input?.camera_id) throw new Error("camera_required");
    const provider = (input.provider ?? "").trim().toLowerCase();
    if (!provider) throw new Error("provider_required");
    const pcid = (input.provider_camera_id ?? "").trim();
    if (!pcid) throw new Error("provider_camera_id_required");
    const cfg = input.configuration_reference?.trim() ?? null;
    if (cfg && (cfg.length > 200 || /(rtsp|rtmp|:\/\/|password|secret|token|@)/i.test(cfg))) {
      throw new Error("config_reference_unsafe");
    }
    return {
      camera_id: input.camera_id,
      provider: provider.slice(0, 50),
      provider_camera_id: pcid.slice(0, 200),
      configuration_reference: cfg,
    };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.cameras.configure");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("project_camera_sources").upsert({
      camera_id: data.camera_id,
      provider: data.provider,
      provider_camera_id: data.provider_camera_id,
      configuration_reference: data.configuration_reference,
    }, { onConflict: "camera_id" });
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId, action: "camera.configure_source",
      entityType: "project_camera", entityId: data.camera_id,
      newValue: { provider: data.provider, provider_camera_id: data.provider_camera_id },
    });
    return { ok: true };
  });