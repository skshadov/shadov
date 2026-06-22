/**
 * Stage 4C — temporary launcher: reads STAGE4C_RUN_TOKEN from env and proxies to orchestrator.
 * Avoids exposing the token outside Edge Function memory.
 * Deleted at the end of stage 4C.
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const token = Deno.env.get("STAGE4C_RUN_TOKEN") ?? "";
  if (token.length < 32) return new Response(JSON.stringify({ error: "no_token" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/stage4c-test-orchestrator`;
  const PUB = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Run-Token": token, "apikey": PUB, "Authorization": `Bearer ${PUB}` },
    body: "{}",
  });
  const txt = await res.text();
  return new Response(txt, { status: res.status, headers: { ...CORS, "Content-Type": "application/json" } });
});