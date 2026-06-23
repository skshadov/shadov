/**
 * Stage 5.3.4 — публичные серверные функции каталога.
 * Только опубликованные записи. Использует server publishable client (RLS-anon).
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type CategoryRow = Database["public"]["Tables"]["service_categories"]["Row"];
type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type PriceRow = Database["public"]["Tables"]["price_items"]["Row"];

export type PublicCategory = Pick<
  CategoryRow,
  "id" | "slug" | "title" | "summary" | "parent_id" | "sort_order" | "seo_title" | "seo_description" | "hero_media_id"
>;
export type PublicService = Pick<
  ServiceRow,
  | "id"
  | "slug"
  | "title"
  | "summary"
  | "body_md"
  | "base_price"
  | "currency"
  | "price_unit"
  | "category_id"
  | "sort_order"
  | "seo_title"
  | "seo_description"
  | "hero_media_id"
>;
export type PublicPriceItem = Pick<
  PriceRow,
  | "id"
  | "group_slug"
  | "subgroup_slug"
  | "title"
  | "unit"
  | "price_min"
  | "price_max"
  | "currency"
  | "notes"
  | "sort_order"
>;

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const CAT_COLS =
  "id, slug, title, summary, parent_id, sort_order, seo_title, seo_description, hero_media_id";
const SVC_COLS =
  "id, slug, title, summary, body_md, base_price, currency, price_unit, category_id, sort_order, seo_title, seo_description, hero_media_id";
const PRICE_COLS =
  "id, group_slug, subgroup_slug, title, unit, price_min, price_max, currency, notes, sort_order";

export const listPublishedCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicCategory[]> => {
    const sb = publicClient();
    const { data, error } = await sb
      .from("service_categories")
      .select(CAT_COLS)
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as PublicCategory[];
  },
);

export const getPublishedCategoryBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input?.slug ?? "").trim().slice(0, 120) }))
  .handler(async ({ data }): Promise<{ category: PublicCategory | null; services: PublicService[] }> => {
    const sb = publicClient();
    const { data: cat, error: cErr } = await sb
      .from("service_categories")
      .select(CAT_COLS)
      .eq("status", "published")
      .eq("slug", data.slug)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!cat) return { category: null, services: [] };
    const { data: svcs, error: sErr } = await sb
      .from("services")
      .select(SVC_COLS)
      .eq("status", "published")
      .eq("category_id", cat.id)
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });
    if (sErr) throw new Error(sErr.message);
    return { category: cat as PublicCategory, services: (svcs ?? []) as PublicService[] };
  });

export const getPublishedServiceBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input?.slug ?? "").trim().slice(0, 120) }))
  .handler(async ({ data }): Promise<{ service: PublicService | null; category: PublicCategory | null }> => {
    const sb = publicClient();
    const { data: svc, error } = await sb
      .from("services")
      .select(SVC_COLS)
      .eq("status", "published")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!svc) return { service: null, category: null };
    let cat: PublicCategory | null = null;
    if (svc.category_id) {
      const { data: c } = await sb
        .from("service_categories")
        .select(CAT_COLS)
        .eq("id", svc.category_id)
        .maybeSingle();
      cat = (c as PublicCategory | null) ?? null;
    }
    return { service: svc as PublicService, category: cat };
  });

export const listPublishedPriceItems = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicPriceItem[]> => {
    const sb = publicClient();
    const { data, error } = await sb
      .from("price_items")
      .select(PRICE_COLS)
      .eq("status", "published")
      .order("group_slug", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as PublicPriceItem[];
  },
);