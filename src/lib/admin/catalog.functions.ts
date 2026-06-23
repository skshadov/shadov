/**
 * Stage 5.3.3 — серверные функции каталога: категории, услуги, прайс-лист.
 * Защита: requireSupabaseAuth + has_admin_permission('admin.catalog.*').
 * Все мутации логируются в admin_audit_log.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type CategoryRow = Database["public"]["Tables"]["service_categories"]["Row"];
type CategoryIns = Database["public"]["Tables"]["service_categories"]["Insert"];
type CategoryUpd = Database["public"]["Tables"]["service_categories"]["Update"];
type ServiceRow  = Database["public"]["Tables"]["services"]["Row"];
type ServiceIns  = Database["public"]["Tables"]["services"]["Insert"];
type ServiceUpd  = Database["public"]["Tables"]["services"]["Update"];
type PriceRow    = Database["public"]["Tables"]["price_items"]["Row"];
type PriceIns    = Database["public"]["Tables"]["price_items"]["Insert"];
type PriceUpd    = Database["public"]["Tables"]["price_items"]["Update"];

export type ServiceCategory = CategoryRow;
export type Service = ServiceRow;
export type PriceItem = PriceRow;
export type CatalogStatus = "draft" | "published" | "archived";

const STATUS = new Set<CatalogStatus>(["draft", "published", "archived"]);
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,120}$/;
const SUBSLUG_RE = /^[a-z0-9][a-z0-9\-_]{0,80}$/;
const CURRENCY_RE = /^[A-Z]{3}$/;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensurePerm(context: { supabase: any }, perm: string) {
  const { data, error } = await context.supabase.rpc("has_admin_permission", { _permission: perm });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("forbidden");
}

function clampStr(v: unknown, max: number, defaultEmpty = true): string {
  if (typeof v !== "string") return defaultEmpty ? "" : "";
  return v.trim().slice(0, max);
}
function asInt(v: unknown, def = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : def;
}
function asMoney(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

/* ════════════════════════════════════════════════════════════════
   Categories
   ════════════════════════════════════════════════════════════════ */

export const listServiceCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ServiceCategory[]> => {
    await ensurePerm(context, "admin.catalog.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("service_categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export interface UpsertCategoryInput {
  id?: string;
  slug: string;
  parent_id?: string | null;
  title: string;
  summary?: string;
  sort_order?: number;
  status?: CatalogStatus;
  hero_media_id?: string | null;
  seo_title?: string;
  seo_description?: string;
}

export const upsertServiceCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: UpsertCategoryInput) => {
    const slug = clampStr(input?.slug, 80);
    if (!SLUG_RE.test(slug)) throw new Error("slug_invalid");
    const title = clampStr(input?.title, 200);
    if (!title) throw new Error("title_required");
    return {
      id: input?.id,
      slug,
      parent_id: input?.parent_id ?? null,
      title,
      summary: clampStr(input?.summary, 2000),
      sort_order: asInt(input?.sort_order, 0),
      status: (input?.status && STATUS.has(input.status) ? input.status : "draft") as CatalogStatus,
      hero_media_id: input?.hero_media_id ?? null,
      seo_title: clampStr(input?.seo_title, 200),
      seo_description: clampStr(input?.seo_description, 400),
    };
  })
  .handler(async ({ data, context }): Promise<ServiceCategory> => {
    await ensurePerm(context, "admin.catalog.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = {
      slug: data.slug,
      parent_id: data.parent_id,
      title: data.title,
      summary: data.summary,
      sort_order: data.sort_order,
      status: data.status,
      hero_media_id: data.hero_media_id,
      seo_title: data.seo_title,
      seo_description: data.seo_description,
      updated_by: context.userId,
    } satisfies CategoryIns;

    let oldValue: ServiceCategory | null = null;
    let result: ServiceCategory;
    if (data.id) {
      const { data: prev } = await supabaseAdmin.from("service_categories").select("*").eq("id", data.id).maybeSingle();
      oldValue = prev ?? null;
      const { data: row, error } = await supabaseAdmin
        .from("service_categories").update(patch as CategoryUpd).eq("id", data.id).select("*").single();
      if (error) throw new Error(error.message);
      result = row;
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("service_categories").insert(patch).select("*").single();
      if (error) throw new Error(error.message);
      result = row;
    }

    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: data.id ? "service_category.update" : "service_category.create",
      entityType: "service_category",
      entityId: result.id,
      oldValue: oldValue as never,
      newValue: result as never,
    });
    return result;
  });

export const deleteServiceCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.catalog.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await supabaseAdmin.from("service_categories").select("*").eq("id", data.id).maybeSingle();
    const { error } = await supabaseAdmin.from("service_categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "service_category.delete",
      entityType: "service_category",
      entityId: data.id,
      oldValue: prev as never,
    });
    return { ok: true };
  });

/* ════════════════════════════════════════════════════════════════
   Services
   ════════════════════════════════════════════════════════════════ */

export const listServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    search?: string; status?: CatalogStatus; category_id?: string;
    limit?: number; offset?: number;
  }) => ({
    search: clampStr(input?.search, 200) || undefined,
    status: input?.status && STATUS.has(input.status) ? input.status : undefined,
    category_id: input?.category_id || undefined,
    limit: Math.min(Math.max(input?.limit ?? 50, 1), 200),
    offset: Math.max(input?.offset ?? 0, 0),
  }))
  .handler(async ({ data, context }): Promise<{ items: Service[]; total: number }> => {
    await ensurePerm(context, "admin.catalog.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("services").select("*", { count: "exact" })
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.status) q = q.eq("status", data.status);
    if (data.category_id) q = q.eq("category_id", data.category_id);
    if (data.search) q = q.or(`slug.ilike.%${data.search}%,title.ilike.%${data.search}%`);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [], total: count ?? 0 };
  });

export interface UpsertServiceInput {
  id?: string;
  slug: string;
  category_id?: string | null;
  title: string;
  summary?: string;
  body_md?: string;
  base_price?: number | string | null;
  price_unit?: string;
  currency?: string;
  status?: CatalogStatus;
  sort_order?: number;
  hero_media_id?: string | null;
  seo_title?: string;
  seo_description?: string;
}

export const upsertService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: UpsertServiceInput) => {
    const slug = clampStr(input?.slug, 120);
    if (!SLUG_RE.test(slug)) throw new Error("slug_invalid");
    const title = clampStr(input?.title, 300);
    if (!title) throw new Error("title_required");
    const currency = clampStr(input?.currency, 3) || "RUB";
    if (!CURRENCY_RE.test(currency)) throw new Error("currency_invalid");
    return {
      id: input?.id,
      slug,
      category_id: input?.category_id ?? null,
      title,
      summary: clampStr(input?.summary, 2000),
      body_md: clampStr(input?.body_md, 200000),
      base_price: asMoney(input?.base_price),
      price_unit: clampStr(input?.price_unit, 60),
      currency,
      status: (input?.status && STATUS.has(input.status) ? input.status : "draft") as CatalogStatus,
      sort_order: asInt(input?.sort_order, 0),
      hero_media_id: input?.hero_media_id ?? null,
      seo_title: clampStr(input?.seo_title, 200),
      seo_description: clampStr(input?.seo_description, 400),
    };
  })
  .handler(async ({ data, context }): Promise<Service> => {
    await ensurePerm(context, "admin.catalog.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = {
      slug: data.slug,
      category_id: data.category_id,
      title: data.title,
      summary: data.summary,
      body_md: data.body_md,
      base_price: data.base_price,
      price_unit: data.price_unit,
      currency: data.currency,
      status: data.status,
      sort_order: data.sort_order,
      hero_media_id: data.hero_media_id,
      seo_title: data.seo_title,
      seo_description: data.seo_description,
      updated_by: context.userId,
    } satisfies ServiceIns;

    let oldValue: Service | null = null;
    let result: Service;
    if (data.id) {
      const { data: prev } = await supabaseAdmin.from("services").select("*").eq("id", data.id).maybeSingle();
      oldValue = prev ?? null;
      const { data: row, error } = await supabaseAdmin
        .from("services").update(patch as ServiceUpd).eq("id", data.id).select("*").single();
      if (error) throw new Error(error.message);
      result = row;
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("services").insert(patch).select("*").single();
      if (error) throw new Error(error.message);
      result = row;
    }
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: data.id ? "service.update" : "service.create",
      entityType: "service",
      entityId: result.id,
      oldValue: oldValue as never,
      newValue: result as never,
    });
    return result;
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.catalog.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await supabaseAdmin.from("services").select("*").eq("id", data.id).maybeSingle();
    const { error } = await supabaseAdmin.from("services").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "service.delete",
      entityType: "service",
      entityId: data.id,
      oldValue: prev as never,
    });
    return { ok: true };
  });

/* ════════════════════════════════════════════════════════════════
   Price items
   ════════════════════════════════════════════════════════════════ */

export const listPriceItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    search?: string; status?: CatalogStatus; group_slug?: string;
    limit?: number; offset?: number;
  }) => ({
    search: clampStr(input?.search, 200) || undefined,
    status: input?.status && STATUS.has(input.status) ? input.status : undefined,
    group_slug: clampStr(input?.group_slug, 80) || undefined,
    limit: Math.min(Math.max(input?.limit ?? 100, 1), 500),
    offset: Math.max(input?.offset ?? 0, 0),
  }))
  .handler(async ({ data, context }): Promise<{ items: PriceItem[]; total: number }> => {
    await ensurePerm(context, "admin.catalog.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("price_items").select("*", { count: "exact" })
      .order("group_slug", { ascending: true })
      .order("subgroup_slug", { ascending: true })
      .order("sort_order", { ascending: true })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.status) q = q.eq("status", data.status);
    if (data.group_slug) q = q.eq("group_slug", data.group_slug);
    if (data.search) q = q.or(`title.ilike.%${data.search}%,group_slug.ilike.%${data.search}%,subgroup_slug.ilike.%${data.search}%`);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [], total: count ?? 0 };
  });

export interface UpsertPriceInput {
  id?: string;
  group_slug: string;
  subgroup_slug?: string;
  title: string;
  unit?: string;
  price_min?: number | string | null;
  price_max?: number | string | null;
  currency?: string;
  status?: CatalogStatus;
  sort_order?: number;
  notes?: string;
}

export const upsertPriceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: UpsertPriceInput) => {
    const group_slug = clampStr(input?.group_slug, 80);
    if (!SUBSLUG_RE.test(group_slug)) throw new Error("group_slug_invalid");
    const subgroup_slug = clampStr(input?.subgroup_slug, 80);
    if (subgroup_slug && !SUBSLUG_RE.test(subgroup_slug)) throw new Error("subgroup_slug_invalid");
    const title = clampStr(input?.title, 300);
    if (!title) throw new Error("title_required");
    const currency = clampStr(input?.currency, 3) || "RUB";
    if (!CURRENCY_RE.test(currency)) throw new Error("currency_invalid");
    const price_min = asMoney(input?.price_min);
    const price_max = asMoney(input?.price_max);
    if (price_min !== null && price_max !== null && price_max < price_min) {
      throw new Error("price_max_less_than_min");
    }
    return {
      id: input?.id,
      group_slug,
      subgroup_slug,
      title,
      unit: clampStr(input?.unit, 60),
      price_min, price_max, currency,
      status: (input?.status && STATUS.has(input.status) ? input.status : "draft") as CatalogStatus,
      sort_order: asInt(input?.sort_order, 0),
      notes: clampStr(input?.notes, 2000),
    };
  })
  .handler(async ({ data, context }): Promise<PriceItem> => {
    await ensurePerm(context, "admin.catalog.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = {
      group_slug: data.group_slug,
      subgroup_slug: data.subgroup_slug,
      title: data.title,
      unit: data.unit,
      price_min: data.price_min,
      price_max: data.price_max,
      currency: data.currency,
      status: data.status,
      sort_order: data.sort_order,
      notes: data.notes,
      updated_by: context.userId,
    } satisfies PriceIns;

    let oldValue: PriceItem | null = null;
    let result: PriceItem;
    if (data.id) {
      const { data: prev } = await supabaseAdmin.from("price_items").select("*").eq("id", data.id).maybeSingle();
      oldValue = prev ?? null;
      const { data: row, error } = await supabaseAdmin
        .from("price_items").update(patch as PriceUpd).eq("id", data.id).select("*").single();
      if (error) throw new Error(error.message);
      result = row;
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("price_items").insert(patch).select("*").single();
      if (error) throw new Error(error.message);
      result = row;
    }
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: data.id ? "price_item.update" : "price_item.create",
      entityType: "price_item",
      entityId: result.id,
      oldValue: oldValue as never,
      newValue: result as never,
    });
    return result;
  });

export const deletePriceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id_required");
    return { id: input.id };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.catalog.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await supabaseAdmin.from("price_items").select("*").eq("id", data.id).maybeSingle();
    const { error } = await supabaseAdmin.from("price_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "price_item.delete",
      entityType: "price_item",
      entityId: data.id,
      oldValue: prev as never,
    });
    return { ok: true };
  });