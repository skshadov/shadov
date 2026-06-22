import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
Deno.serve(async () => {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: list } = await admin.storage.from("project-documents").list("stage4a-runs", { limit: 1000 });
  const paths = (list ?? []).map((f) => `stage4a-runs/${f.name}`);
  if (!paths.length) return new Response(JSON.stringify({ removed: 0 }), { headers: { "Content-Type": "application/json" } });
  const { data, error } = await admin.storage.from("project-documents").remove(paths);
  return new Response(JSON.stringify({ removed: data?.length ?? 0, paths, error: error?.message }), { headers: { "Content-Type": "application/json" } });
});