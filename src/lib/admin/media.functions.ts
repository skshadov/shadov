/**
 * Stage 5.3.2 — серверные функции медиатеки (приватный bucket `site-media`).
 * Загрузка идёт с клиента через signed upload URL; затем метаданные регистрируются
 * в `media_assets`. Файлы выдаются по signed URL (срок ~7 дней).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["media_assets"]["Row"];
export type MediaAsset = Row;

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml",
  "video/mp4", "video/webm",
  "application/pdf",
]);

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

/* ───────── List ───────── */

export const listMediaAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string; limit?: number; offset?: number }) => ({
    search: typeof input?.search === "string" ? input.search.trim().slice(0, 200) : undefined,
    limit: Math.min(Math.max(input?.limit ?? 60, 1), 200),
    offset: Math.max(input?.offset ?? 0, 0),
  }))
  .handler(async ({ data, context }): Promise<{ items: MediaAsset[]; total: number }> => {
    await ensurePerm(context, "admin.media.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("media_assets")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.search) q = q.or(`title.ilike.%${data.search}%,alt_text.ilike.%${data.search}%,storage_path.ilike.%${data.search}%`);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { items: (rows ?? []) as MediaAsset[], total: count ?? 0 };
  });

/* ───────── Upload URL ───────── */

export const createMediaUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { file_name: string; mime_type: string; size_bytes: number }) => {
    const fn = sanitizeFileName(input?.file_name ?? "");
    if (!fn) throw new Error("file_name_required");
    if (!ALLOWED_MIME.has(input?.mime_type)) throw new Error("mime_not_allowed");
    if (!Number.isFinite(input?.size_bytes) || input.size_bytes <= 0) throw new Error("size_invalid");
    if (input.size_bytes > MAX_BYTES) throw new Error("file_too_large");
    return { file_name: fn, mime_type: input.mime_type, size_bytes: input.size_bytes };
  })
  .handler(async ({ data, context }): Promise<{ token: string; path: string; bucket: string; storage_path: string }> => {
    await ensurePerm(context, "admin.media.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 10);
    const path = `library/${ts}_${rand}_${data.file_name}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("site-media")
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "upload_url_failed");
    return {
      token: signed.token,
      path: signed.path,
      bucket: "site-media",
      storage_path: `site-media/${signed.path}`,
    };
  });

/* ───────── Register uploaded file ───────── */

export const registerUploadedMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    storage_path: string; mime_type: string; size_bytes: number;
    width?: number | null; height?: number | null;
    alt_text?: string; title?: string;
  }) => {
    if (!input?.storage_path?.startsWith("site-media/")) throw new Error("bad_path");
    if (!ALLOWED_MIME.has(input?.mime_type)) throw new Error("mime_not_allowed");
    if (!Number.isFinite(input?.size_bytes) || input.size_bytes <= 0) throw new Error("size_invalid");
    if (input.size_bytes > MAX_BYTES) throw new Error("file_too_large");
    return {
      storage_path: input.storage_path,
      mime_type: input.mime_type,
      size_bytes: Math.floor(input.size_bytes),
      width: typeof input.width === "number" && input.width > 0 ? Math.floor(input.width) : null,
      height: typeof input.height === "number" && input.height > 0 ? Math.floor(input.height) : null,
      alt_text: (input.alt_text ?? "").slice(0, 500),
      title: (input.title ?? "").slice(0, 300),
    };
  })
  .handler(async ({ data, context }): Promise<MediaAsset> => {
    await ensurePerm(context, "admin.media.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("media_assets")
      .insert({ ...data, uploaded_by: context.userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "media.upload",
      entityType: "media_asset",
      entityId: row.id,
      newValue: row as never,
    });
    return row;
  });

/* ───────── Update metadata ───────── */

export const updateMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; alt_text?: string; title?: string }) => {
    if (!input?.id) throw new Error("id_required");
    const patch: Record<string, string> = {};
    if (typeof input.alt_text === "string") patch.alt_text = input.alt_text.slice(0, 500);
    if (typeof input.title === "string") patch.title = input.title.slice(0, 300);
    return { id: input.id, patch };
  })
  .handler(async ({ data, context }): Promise<MediaAsset> => {
    await ensurePerm(context, "admin.media.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("media_assets").update(data.patch).eq("id", data.id).select("*").single();
    if (error) throw new Error(error.message);

    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "media.update",
      entityType: "media_asset",
      entityId: row.id,
      newValue: row as never,
    });
    return row;
  });

/* ───────── Delete ───────── */

export const deleteMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.media.delete");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev, error: readErr } = await supabaseAdmin
      .from("media_assets").select("*").eq("id", data.id).maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!prev) return { ok: true };
    const objectPath = prev.storage_path.replace(/^site-media\//, "");
    await supabaseAdmin.storage.from("site-media").remove([objectPath]).catch(() => undefined);
    const { error } = await supabaseAdmin.from("media_assets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);

    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "media.delete",
      entityType: "media_asset",
      entityId: data.id,
      oldValue: prev as never,
    });
    return { ok: true };
  });

/* ───────── Signed download URL (for admin previews) ───────── */

export const getMediaSignedUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[]; expires_in?: number }) => {
    if (!Array.isArray(input?.ids)) throw new Error("ids_required");
    const ids = input.ids.filter((v) => typeof v === "string" && v.length > 0).slice(0, 200);
    const expires = Math.min(Math.max(input?.expires_in ?? 60 * 60, 60), 60 * 60 * 24 * 7);
    return { ids, expires };
  })
  .handler(async ({ data, context }): Promise<Record<string, string>> => {
    await ensurePerm(context, "admin.media.read");
    if (data.ids.length === 0) return {};
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("media_assets").select("id, storage_path").in("id", data.ids);
    if (error) throw new Error(error.message);
    const out: Record<string, string> = {};
    for (const r of rows ?? []) {
      const objectPath = r.storage_path.replace(/^site-media\//, "");
      const { data: signed } = await supabaseAdmin.storage
        .from("site-media").createSignedUrl(objectPath, data.expires);
      if (signed?.signedUrl) out[r.id] = signed.signedUrl;
    }
    return out;
  });