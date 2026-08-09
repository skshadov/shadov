/**
 * Публичная отдача заменённых через админку фотографий из приватного бакета.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/site-image/$key")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = String(params.key ?? "").slice(0, 120);
        if (!/^[A-Za-z0-9._-]+$/.test(key)) return new Response("Bad key", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("site_images")
          .select("url, updated_at")
          .eq("key", key)
          .maybeSingle();
        if (!row) return new Response("Not found", { status: 404 });

        const objectPath = row.url.replace(/^site-media\//, "");
        const { data: file, error } = await supabaseAdmin.storage.from("site-media").download(objectPath);
        if (error || !file) return new Response("Not found", { status: 404 });

        return new Response(await file.arrayBuffer(), {
          headers: {
            "content-type": file.type || "image/jpeg",
            "cache-control": "public, max-age=300, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});