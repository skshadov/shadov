/**
 * Серверные функции админки: прайс направлений и фотографии сайта.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface SitePricingRow {
  slug: string;
  data_json: string;
  updated_at: string;
}
export interface SiteImageRow {
  key: string;
  url: string;
  width: number | null;
  height: number | null;
  updated_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensurePerm(context: { supabase: any }, perm: string) {
  const { data, error } = await context.supabase.rpc("has_admin_permission", { _permission: perm });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("forbidden");
}

/* ───────── Прайс ───────── */

export const listPricingOverrides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SitePricingRow[]> => {
    await ensurePerm(context, "admin.catalog.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("site_pricing").select("slug, data, updated_at");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      slug: r.slug,
      data_json: JSON.stringify(r.data ?? {}),
      updated_at: r.updated_at,
    }));
  });

export const savePricingOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slug: string; data_json: string }) => {
    const slug = String(input?.slug ?? "").trim();
    if (!slug) throw new Error("slug_required");
    if (typeof input?.data_json !== "string" || input.data_json.length > 400_000) throw new Error("data_required");
    return { slug, data_json: input.data_json };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.catalog.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_pricing")
      .upsert(
        {
          slug: data.slug,
          data: JSON.parse(data.data_json) as never,
          updated_by: context.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      );
    if (error) throw new Error(error.message);

    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "site_pricing.save",
      entityType: "site_pricing",
      entityId: data.slug,
      newValue: JSON.parse(data.data_json) as never,
    });
    return { ok: true };
  });

export const resetPricingOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slug: string }) => {
    const slug = String(input?.slug ?? "").trim();
    if (!slug) throw new Error("slug_required");
    return { slug };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.catalog.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_pricing").delete().eq("slug", data.slug);
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "site_pricing.reset",
      entityType: "site_pricing",
      entityId: data.slug,
    });
    return { ok: true };
  });

/* ───────── Фотографии ───────── */

export const listSiteImages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SiteImageRow[]> => {
    await ensurePerm(context, "admin.media.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("site_images").select("key, url, width, height, updated_at");
    if (error) throw new Error(error.message);
    return (data ?? []) as SiteImageRow[];
  });

export const saveSiteImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string; storage_path: string; width?: number | null; height?: number | null }) => {
    const key = String(input?.key ?? "").trim();
    if (!/^[A-Za-z0-9._-]+$/.test(key)) throw new Error("bad_key");
    if (!input?.storage_path?.startsWith("site-media/")) throw new Error("bad_path");
    return {
      key,
      storage_path: input.storage_path,
      width: typeof input.width === "number" && input.width > 0 ? Math.floor(input.width) : null,
      height: typeof input.height === "number" && input.height > 0 ? Math.floor(input.height) : null,
    };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.media.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_images").upsert(
      {
        key: data.key,
        url: data.storage_path,
        width: data.width,
        height: data.height,
        updated_by: context.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "site_image.save",
      entityType: "site_image",
      entityId: data.key,
      newValue: { url: data.storage_path } as never,
    });
    return { ok: true };
  });

export const resetSiteImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string }) => {
    const key = String(input?.key ?? "").trim();
    if (!key) throw new Error("key_required");
    return { key };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.media.write");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_images").delete().eq("key", data.key);
    if (error) throw new Error(error.message);
    const { logAdminAction } = await import("./audit.server");
    await logAdminAction({
      actorUserId: context.userId,
      action: "site_image.reset",
      entityType: "site_image",
      entityId: data.key,
    });
    return { ok: true };
  });