/**
 * Админские серверные функции модерации отзывов.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminAuth as requireSupabaseAuth } from "./require-auth";

export type AdminReview = {
  id: string;
  author_name: string;
  author_role: string | null;
  contact: string | null;
  service_slug: string | null;
  rating: number;
  body: string;
  source: string | null;
  moderation_status: string;
  is_published: boolean;
  submitted_at: string | null;
  created_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensurePerm(context: { supabase: any }, perm: string) {
  const { data, error } = await context.supabase.rpc("has_admin_permission", { _permission: perm });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("forbidden");
}

const SELECT =
  "id, author_name, author_role, contact, service_slug, rating, body, source, moderation_status, is_published, submitted_at, created_at";

export const listAdminReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ status: z.enum(["pending", "approved", "rejected", "all"]).default("pending") }).parse(data ?? {}),
  )
  .handler(async ({ data, context }): Promise<AdminReview[]> => {
    await ensurePerm(context, "admin.reviews.read");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("portfolio_reviews").select(SELECT).order("created_at", { ascending: false }).limit(200);
    if (data.status !== "all") q = q.eq("moderation_status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as AdminReview[];
  });

export const moderateReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["approve", "reject", "unpublish", "delete"]),
        note: z.string().max(1000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensurePerm(context, "admin.reviews.publish");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.action === "delete") {
      const { error } = await supabaseAdmin.from("portfolio_reviews").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    const now = new Date().toISOString();
    const patch =
      data.action === "approve"
        ? { moderation_status: "approved", is_published: true, published_at: now }
        : data.action === "reject"
          ? { moderation_status: "rejected", is_published: false }
          : { moderation_status: "pending", is_published: false };

    const { error } = await supabaseAdmin
      .from("portfolio_reviews")
      .update({ ...patch, moderation_note: data.note ?? null, moderated_at: now, moderated_by: context.userId } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
