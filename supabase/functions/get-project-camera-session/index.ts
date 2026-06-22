/**
 * Stage 4 — viewer-сессия камеры. Никогда не возвращает RTSP/логин/пароль.
 * На этапе 4 реальный поставщик не подключён — ответ всегда camera_not_configured.
 */
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ success: false, code: "unauthorized" }, 401);
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const PUBLISHABLE = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !PUBLISHABLE || !SERVICE) return json({ success: false, code: "server_not_configured" }, 503);
  let body: { camera_id?: string } = {};
  try { body = await req.json(); } catch { return json({ success: false, code: "bad_request" }, 400); }
  const cameraId = body.camera_id;
  if (typeof cameraId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cameraId)) {
    return json({ success: false, code: "camera_not_configured" }, 200);
  }
  const userClient = createClient(SUPABASE_URL, PUBLISHABLE, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ success: false, code: "unauthorized" }, 401);
  const { data: cam } = await userClient
    .from("project_cameras").select("id").eq("id", cameraId).maybeSingle();
  if (!cam) return json({ success: false, code: "camera_not_configured" }, 200);
  const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: source } = await admin
    .from("project_camera_sources").select("provider").eq("camera_id", cameraId).maybeSingle();
  if (!source) return json({ success: false, code: "camera_not_configured" }, 200);
  // Future: short-lived viewer session. At Stage 4 — provider not enabled.
  return json({ success: false, code: "camera_not_configured" }, 200);
});