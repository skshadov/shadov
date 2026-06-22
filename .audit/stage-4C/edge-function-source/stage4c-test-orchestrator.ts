/**
 * Stage 4C — TEMPORARY signed URL TTL=2 wrapper for expiry harness.
 * Gate via X-Run-Token; production TTL = 300 (in get-project-document-url) stays unchanged.
 */
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-run-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const TTL = 2;
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
function ct(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a), eb = new TextEncoder().encode(b);
  const len = Math.max(ea.length, eb.length); let d = ea.length ^ eb.length;
  for (let i=0;i<len;i++) d |= (ea[i]??0) ^ (eb[i]??0);
  return d===0;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const tok = req.headers.get("x-run-token") ?? "";
  const exp = Deno.env.get("STAGE4C_RUN_TOKEN") ?? "";
  if (exp.length < 32 || !ct(tok, exp)) return json({ error: "forbidden" }, 403);
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
  const URL = Deno.env.get("SUPABASE_URL")!;
  const PUB = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
  const SVC = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  let body: any = {}; try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const docId = body.document_id;
  if (typeof docId !== "string") return json({ error: "document_not_found" }, 404);
  const user = createClient(URL, PUB, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: u } = await user.auth.getUser();
  if (!u?.user) return json({ error: "unauthorized" }, 401);
  const { data: doc } = await user.from("project_documents").select("storage_path").eq("id", docId).eq("is_visible_to_client", true).maybeSingle();
  if (!doc) return json({ error: "document_not_found" }, 404);
  const adm = createClient(URL, SVC, { auth: { persistSession: false } });
  const { data: signed } = await adm.storage.from("project-documents").createSignedUrl(doc.storage_path, TTL);
  if (!signed?.signedUrl) return json({ error: "document_not_found" }, 404);
  return json({ url: signed.signedUrl, expires_in: TTL });
});