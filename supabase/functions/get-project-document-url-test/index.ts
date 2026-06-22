/**
 * Stage 4A — тестовая обёртка get-project-document-url с TTL=2s для проверки
 * фактического истечения signed URL без 5-минутного ожидания. Использует
 * ту же логику валидации, но подменяет TTL. Требует X-Stage4A-Run-Token либо
 * вызывается из stage4a-test-orchestrator (которому передан JWT clientA).
 * После теста функция удаляется.
 */
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const TTL = 2;
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const PUBLISHABLE = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!SUPABASE_URL || !PUBLISHABLE || !SERVICE) return json({ error: "server_not_configured" }, 503);

  let body: { document_id?: string } = {};
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const documentId = body.document_id;
  if (typeof documentId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(documentId)) {
    return json({ error: "document_not_found", code: "document_not_found" }, 404);
  }
  const userClient = createClient(SUPABASE_URL, PUBLISHABLE, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);
  const { data: doc } = await userClient.from("project_documents")
    .select("id,storage_path,is_visible_to_client").eq("id", documentId).eq("is_visible_to_client", true).maybeSingle();
  if (!doc || !doc.storage_path) return json({ error: "document_not_found", code: "document_not_found" }, 404);
  const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: signed, error: signErr } = await admin.storage.from("project-documents").createSignedUrl(doc.storage_path, TTL);
  if (signErr || !signed?.signedUrl) return json({ error: "document_not_found", code: "document_not_found" }, 404);
  return json({ url: signed.signedUrl, expires_in: TTL });
});