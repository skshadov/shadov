/**
 * Stage 5.3.2 — серверные функции для контентных блоков сайта.
 * Защита: requireSupabaseAuth + has_admin_permission ('admin.content.*').
 * Публичное чтение (для рендеринга на сайте) — отдельная функция без auth,
 * использует server publishable client и RLS-политику `status = 'published'`.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["content_blocks"]["Row"];
type Update = Database["public"]["Tables"]["content_blocks"]["Update"];

export type ContentBlock = Row;
export type ContentStatus = "draft" | "published" | "archived";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensurePerm(context: { supabase: any }, perm: string) {
  const { data, error } = await context.supabase.rpc("has_admin_permission", { _permission: perm });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("forbidden");
}

const SLUG_RE = /^[a-z0-9][a-z0-9\-_./]{0,150}$/;
const LOCALE_RE = /^[a-z]{2}(-[A-Z]{2})?$/;
const STATUS = new Set<ContentStatus>(["draft", "published", "archived"]);

/* ───────── Admin list ───────── */

export interface ListContentInput {
  search?: string;
  status?: ContentStatus;
  locale?: string;
  limit?: number;
  offset?: number;
}

export const listContentBlocks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ListContentInput) => ({
    search: typeof input?.search === "string" ? input.search.trim().slice(0, 200) : undefined,
    status: input?.status && STATUS.has(input.status) ? input.status : undefined,
    locale: typeof input?.locale === "string" && LOCALE_RE.test(input.locale) ? input.locale : undefined,
    limit: Math.min(Math.max(input?.limit ?? 50, 1), 200),
    offset: Math.max(input?.offset ?? 0, 0),
  }))
  .handler(async ({ data, context }): Promise<{ items: ContentBlock[]; total: number }> => {
    await ensurePerm(context, "admin.content.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("content_blocks")
      .select("*", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.status) q = q.eq("status", data.status);
    if (data.locale) q = q.eq("locale", data.locale);
    if (data.search) q = q.or(`slug.ilike.%${data.search}%,title.ilike.%${data.search}%`);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { items: (rows ?? []) as ContentBlock[], total: count ?? 0 };
  });

/* ───────── Admin get ───────── */

export const getContentBlock = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<ContentBlock | null> => {
    await ensurePerm(context, "admin.content.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("content_blocks").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? null;
  });

/* ───────── Admin upsert ───────── */

export interface UpsertContentInput {
  id?: string;
  slug: string;
  locale?: string;
  title?: string;
  body_md?: string;
  body_html?: string;
  status?: ContentStatus;
}

export const upsertContentBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: UpsertContentInput) => {
    const slug = (input?.slug ?? "").trim();
    if (!SLUG_RE.test(slug)) throw new Error("slug_invalid");
    const locale = input?.locale && LOCALE_RE.test(input.locale) ? input.locale : "ru";
    const title = (input?.title ?? "").trim().slice(0, 300);
    const body_md = (input?.body_md ?? "").slice(0, 200000);
    const body_html = (input?.body_html ?? "").slice(0, 400000);
    const status: ContentStatus = input?.status && STATUS.has(input.status) ? input.status : "draft";
    return { id: input?.id, slug, locale, title, body_md, body_html, status };
  })
  .handler(async ({ data, context }): Promise<ContentBlock> => {
    await ensurePerm(context, "admin.content.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: Update = {
      slug: data.slug,
      locale: data.locale,
      title: data.title,
      body_md: data.body_md,
      body_html: data.body_html,
      status: data.status,
      published_at: data.status === "published" ? new Date().toISOString() : null,
      updated_by: context.userId,
    };

    let result: ContentBlock;
    let oldValue: ContentBlock | null = null;
    if (data.id) {
      const { data: prev } = await supabaseAdmin.from("content_blocks").select("*").eq("id", data.id).maybeSingle();
      oldValue = prev ?? null;
      // Preserve published_at if already published and still published
      if (oldValue?.status === "published" && data.status === "published" && oldValue.published_at) {
        patch.published_at = oldValue.published_at;
      }
      const { data: row, error } = await supabaseAdmin
        .from("content_blocks").update(patch).eq("id", data.id).select("*").single();
      if (error) throw new Error(error.message);
      result = row;
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("content_blocks").insert(patch).select("*").single();
      if (error) throw new Error(error.message);
      result = row;
    }

    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: data.id ? "content_block.update" : "content_block.create",
      entityType: "content_block",
      entityId: result.id,
      oldValue: oldValue as never,
      newValue: result as never,
    });

    return result;
  });

/* ───────── Admin delete ───────── */

export const deleteContentBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.content.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await supabaseAdmin.from("content_blocks").select("*").eq("id", data.id).maybeSingle();
    const { error } = await supabaseAdmin.from("content_blocks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);

    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "content_block.delete",
      entityType: "content_block",
      entityId: data.id,
      oldValue: prev as never,
    });
    return { ok: true };
  });

/* ───────── Public read ───────── */

export interface PublicContentBlock {
  slug: string;
  locale: string;
  title: string;
  body_md: string;
  body_html: string;
  published_at: string | null;
}

export const getPublicContentBlock = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string; locale?: string }) => {
    const slug = (input?.slug ?? "").trim();
    if (!SLUG_RE.test(slug)) throw new Error("slug_invalid");
    const locale = input?.locale && LOCALE_RE.test(input.locale) ? input.locale : "ru";
    return { slug, locale };
  })
  .handler(async ({ data }): Promise<PublicContentBlock | null> => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return null;
    const client = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data: row, error } = await client
      .from("content_blocks")
      .select("slug, locale, title, body_md, body_html, published_at")
      .eq("slug", data.slug)
      .eq("locale", data.locale)
      .eq("status", "published")
      .maybeSingle<PublicContentBlock>();
    if (error) return null;
    return row ?? null;
  });