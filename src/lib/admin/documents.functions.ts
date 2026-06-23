/**
 * Stage 5.2.3 — серверные функции: документы проекта и ежедневные отчёты.
 * Все операции защищены requireSupabaseAuth + has_admin_permission.
 * Загрузка файлов выполняется на клиенте напрямую в bucket project-documents
 * через signed upload URL, который выдаёт createDocumentUploadUrl.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg", "image/png", "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv",
]);

export interface DocumentItem {
  id: string;
  project_id: string;
  file_name: string;
  title: string | null;
  description: string | null;
  document_category: string | null;
  document_date: string | null;
  is_visible_to_client: boolean;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface DailyReportItem {
  id: string;
  project_id: string;
  report_date: string;
  title: string;
  summary: string;
  work_completed: string[];
  next_steps: string[];
  issues: string[];
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  documents_count: number;
}

export interface DailyReportDetail extends DailyReportItem {
  documents: Array<{ id: string; file_name: string; title: string | null; sort_order: number }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensurePerm(context: { supabase: any }, perm: string) {
  const { data, error } = await context.supabase.rpc("has_admin_permission", { _permission: perm });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("forbidden");
}

function sanitizeFileName(name: string): string {
  const trimmed = name.trim().slice(0, 200);
  return trimmed.replace(/[^A-Za-z0-9._\-а-яА-ЯёЁ ()]+/g, "_");
}

/* ===================== DOCUMENTS ===================== */

export const listProjectDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { project_id: string }) => {
    if (!input?.project_id) throw new Error("project_required");
    return { project_id: input.project_id };
  })
  .handler(async ({ data, context }): Promise<DocumentItem[]> => {
    await ensurePerm(context, "admin.documents.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("project_documents")
      .select("*")
      .eq("project_id", data.project_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as DocumentItem[];
  });

export const createDocumentUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { project_id: string; file_name: string; mime_type: string; size_bytes: number }) => {
    if (!input?.project_id) throw new Error("project_required");
    const fn = sanitizeFileName(input.file_name ?? "");
    if (!fn) throw new Error("file_name_required");
    if (!ALLOWED_MIME.has(input.mime_type)) throw new Error("mime_not_allowed");
    if (!Number.isFinite(input.size_bytes) || input.size_bytes <= 0) throw new Error("size_invalid");
    if (input.size_bytes > MAX_FILE_BYTES) throw new Error("file_too_large");
    return { project_id: input.project_id, file_name: fn, mime_type: input.mime_type, size_bytes: input.size_bytes };
  })
  .handler(async ({ data, context }): Promise<{ token: string; path: string; bucket: string }> => {
    await ensurePerm(context, "admin.documents.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 10);
    const path = `${data.project_id}/${ts}_${rand}_${data.file_name}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("project-documents")
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "upload_url_failed");
    return { token: signed.token, path: signed.path, bucket: "project-documents" };
  });

export const registerUploadedDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    project_id: string; storage_path: string; file_name: string; mime_type: string;
    size_bytes: number; title?: string; description?: string; document_category?: string;
    document_date?: string | null; is_visible_to_client?: boolean;
  }) => {
    if (!input?.project_id || !input?.storage_path) throw new Error("required");
    if (!ALLOWED_MIME.has(input.mime_type)) throw new Error("mime_not_allowed");
    if (input.size_bytes > MAX_FILE_BYTES) throw new Error("file_too_large");
    return {
      project_id: input.project_id,
      storage_path: input.storage_path,
      file_name: sanitizeFileName(input.file_name),
      mime_type: input.mime_type,
      size_bytes: input.size_bytes,
      title: input.title?.trim().slice(0, 200) || null,
      description: input.description?.slice(0, 2000) || null,
      document_category: input.document_category?.slice(0, 50) || null,
      document_date: input.document_date ?? null,
      is_visible_to_client: input.is_visible_to_client ?? false,
    };
  })
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await ensurePerm(context, "admin.documents.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("project_documents")
      .insert({ ...data, uploaded_by: context.userId })
      .select("id").single();
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "document.create",
      entityType: "project_document",
      entityId: row.id,
      newValue: { project_id: data.project_id, file_name: data.file_name, size_bytes: data.size_bytes },
    });
    return { id: row.id };
  });

export const updateDocumentMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    id: string; title?: string | null; description?: string | null;
    document_category?: string | null; document_date?: string | null;
    is_visible_to_client?: boolean;
  }) => {
    if (!input?.id) throw new Error("id_required");
    return {
      id: input.id,
      title: input.title === undefined ? undefined : (input.title?.slice(0, 200) ?? null),
      description: input.description === undefined ? undefined : (input.description?.slice(0, 2000) ?? null),
      document_category: input.document_category === undefined ? undefined : (input.document_category?.slice(0, 50) ?? null),
      document_date: input.document_date === undefined ? undefined : (input.document_date ?? null),
      is_visible_to_client: input.is_visible_to_client,
    };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.documents.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, string | boolean | null> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.document_category !== undefined) patch.document_category = data.document_category;
    if (data.document_date !== undefined) patch.document_date = data.document_date;
    if (data.is_visible_to_client !== undefined) patch.is_visible_to_client = data.is_visible_to_client;
    if (Object.keys(patch).length === 0) return { ok: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabaseAdmin.from("project_documents").update(patch as any).eq("id", data.id);
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "document.update_meta",
      entityType: "project_document",
      entityId: data.id,
      newValue: patch as { [k: string]: string | boolean | null },
    });
    return { ok: true };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.documents.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: doc } = await supabaseAdmin
      .from("project_documents").select("storage_path, project_id, file_name").eq("id", data.id).maybeSingle();
    if (!doc) throw new Error("not_found");
    await supabaseAdmin.storage.from("project-documents").remove([doc.storage_path]);
    const { error } = await supabaseAdmin.from("project_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "document.delete",
      entityType: "project_document",
      entityId: data.id,
      oldValue: { project_id: doc.project_id, file_name: doc.file_name, storage_path: doc.storage_path },
    });
    return { ok: true };
  });

export const getDocumentDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<{ url: string; file_name: string }> => {
    await ensurePerm(context, "admin.documents.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: doc } = await supabaseAdmin
      .from("project_documents").select("storage_path, file_name").eq("id", data.id).maybeSingle();
    if (!doc) throw new Error("not_found");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("project-documents").createSignedUrl(doc.storage_path, 300);
    if (error || !signed) throw new Error(error?.message ?? "sign_failed");
    return { url: signed.signedUrl, file_name: doc.file_name };
  });

/* ===================== DAILY REPORTS ===================== */

function normArr(v: unknown, max = 30): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).slice(0, 1000)).filter((x) => x.trim().length > 0).slice(0, max);
}

export const listDailyReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { project_id: string }) => {
    if (!input?.project_id) throw new Error("project_required");
    return { project_id: input.project_id };
  })
  .handler(async ({ data, context }): Promise<DailyReportItem[]> => {
    await ensurePerm(context, "admin.reports.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("project_daily_reports")
      .select("*")
      .eq("project_id", data.project_id)
      .order("report_date", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((r) => r.id);
    const linkCount = new Map<string, number>();
    if (ids.length) {
      const { data: links } = await supabaseAdmin
        .from("project_daily_report_documents").select("report_id").in("report_id", ids);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (links ?? []).forEach((l: any) => linkCount.set(l.report_id, (linkCount.get(l.report_id) ?? 0) + 1));
    }
    return (rows ?? []).map((r) => ({ ...(r as Omit<DailyReportItem, "documents_count">), documents_count: linkCount.get(r.id) ?? 0 }));
  });

export const getDailyReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<DailyReportDetail | null> => {
    await ensurePerm(context, "admin.reports.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: report, error } = await supabaseAdmin
      .from("project_daily_reports").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!report) return null;
    const { data: links } = await supabaseAdmin
      .from("project_daily_report_documents")
      .select("document_id, sort_order, project_documents(file_name, title)")
      .eq("report_id", data.id)
      .order("sort_order", { ascending: true });
    return {
      ...(report as Omit<DailyReportItem, "documents_count">),
      documents_count: links?.length ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents: ((links ?? []) as any[]).map((l) => ({
        id: l.document_id, sort_order: l.sort_order,
        file_name: l.project_documents?.file_name ?? "—",
        title: l.project_documents?.title ?? null,
      })),
    };
  });

export const upsertDailyReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    id?: string; project_id: string; report_date: string; title: string; summary: string;
    work_completed?: string[]; next_steps?: string[]; issues?: string[]; publish?: boolean;
  }) => {
    if (!input?.project_id) throw new Error("project_required");
    if (!input?.report_date) throw new Error("date_required");
    const title = (input.title ?? "").trim();
    const summary = (input.summary ?? "").trim();
    if (title.length < 3) throw new Error("title_too_short");
    if (summary.length < 5) throw new Error("summary_too_short");
    return {
      id: input.id,
      project_id: input.project_id,
      report_date: input.report_date,
      title: title.slice(0, 200),
      summary: summary.slice(0, 4000),
      work_completed: normArr(input.work_completed),
      next_steps: normArr(input.next_steps),
      issues: normArr(input.issues),
      publish: !!input.publish,
    };
  })
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await ensurePerm(context, "admin.reports.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      project_id: data.project_id,
      report_date: data.report_date,
      title: data.title,
      summary: data.summary,
      work_completed: data.work_completed,
      next_steps: data.next_steps,
      issues: data.issues,
      published_at: data.publish ? new Date().toISOString() : null,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("project_daily_reports").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      const { logAdminAction } = await import("./audit.server");
      await logAdminAction({
        actorUserId: context.userId, action: "report.update",
        entityType: "project_daily_report", entityId: data.id,
        newValue: { report_date: data.report_date, published: data.publish },
      });
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("project_daily_reports")
      .insert({ ...payload, created_by: context.userId })
      .select("id").single();
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId, action: "report.create",
      entityType: "project_daily_report", entityId: row.id,
      newValue: { project_id: data.project_id, report_date: data.report_date, published: data.publish },
    });
    return { id: row.id };
  });

export const deleteDailyReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.reports.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("project_daily_reports").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId, action: "report.delete",
      entityType: "project_daily_report", entityId: data.id,
    });
    return { ok: true };
  });

export const linkDocumentToReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { report_id: string; document_id: string; sort_order?: number }) => {
    if (!input?.report_id || !input?.document_id) throw new Error("required");
    return { report_id: input.report_id, document_id: input.document_id, sort_order: Math.max(0, input.sort_order ?? 0) };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.reports.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("project_daily_report_documents")
      .upsert({ report_id: data.report_id, document_id: data.document_id, sort_order: data.sort_order },
        { onConflict: "report_id,document_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unlinkDocumentFromReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { report_id: string; document_id: string }) => {
    if (!input?.report_id || !input?.document_id) throw new Error("required");
    return { report_id: input.report_id, document_id: input.document_id };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.reports.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("project_daily_report_documents")
      .delete().eq("report_id", data.report_id).eq("document_id", data.document_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });