import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type PortfolioProjectListItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  location: string | null;
  summary: string;
  cover_url: string | null;
  area_m2: number | null;
  duration_months: number | null;
  year_completed: number | null;
  tags: string[];
};

export type PortfolioProjectDetail = PortfolioProjectListItem & {
  description: string | null;
  gallery: { url: string; alt?: string | null }[];
  published_at: string | null;
};

export type PublicReview = {
  id: string;
  author_name: string;
  author_role: string | null;
  rating: number;
  body: string;
  source: string | null;
  source_url: string | null;
  project_id: string | null;
  published_at: string | null;
};

export const listPublishedPortfolioProjects = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({ limit: z.number().int().min(1).max(60).optional() })
      .parse(data ?? {}),
  )
  .handler(async ({ data }): Promise<PortfolioProjectListItem[]> => {
    const supabase = publicClient();
    const { data: rows, error } = await supabase
      .from("portfolio_projects")
      .select(
        "id,slug,title,category,location,summary,cover_url,area_m2,duration_months,year_completed,tags",
      )
      .eq("is_published", true)
      .order("sort_order", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(data.limit ?? 24);
    if (error) throw error;
    return (rows ?? []) as PortfolioProjectListItem[];
  });

export const getPublishedPortfolioProject = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({ slug: z.string().min(1).max(160) }).parse(data),
  )
  .handler(async ({ data }): Promise<PortfolioProjectDetail | null> => {
    const supabase = publicClient();
    const { data: row, error } = await supabase
      .from("portfolio_projects")
      .select(
        "id,slug,title,category,location,summary,description,cover_url,gallery,area_m2,duration_months,year_completed,tags,published_at",
      )
      .eq("is_published", true)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw error;
    if (!row) return null;
    const gallery = Array.isArray(row.gallery)
      ? (row.gallery as { url: string; alt?: string | null }[])
      : [];
    return { ...row, gallery } as PortfolioProjectDetail;
  });

export const listPublishedReviews = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({ limit: z.number().int().min(1).max(60).optional() })
      .parse(data ?? {}),
  )
  .handler(async ({ data }): Promise<PublicReview[]> => {
    const supabase = publicClient();
    const { data: rows, error } = await supabase
      .from("portfolio_reviews")
      .select(
        "id,author_name,author_role,rating,body,source,source_url,project_id,published_at",
      )
      .eq("is_published", true)
      .order("sort_order", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(data.limit ?? 12);
    if (error) throw error;
    return (rows ?? []) as PublicReview[];
  });