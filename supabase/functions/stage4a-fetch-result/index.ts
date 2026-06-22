import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.searchParams.get("p") ?? "";
  if (!path.startsWith("stage4a-runs/")) return new Response("bad", { status: 400 });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data, error } = await admin.storage.from("project-documents").download(path);
  if (error || !data) return new Response(JSON.stringify({ error: error?.message }), { status: 404 });
  const text = await data.text();
  return new Response(text, { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
});