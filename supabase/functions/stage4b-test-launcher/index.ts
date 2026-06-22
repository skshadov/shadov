// Stage 4B — temporary launcher. Forwards a single secret-token request to the orchestrator.
// Deleted at end of Stage 4B.
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  // Temporary one-shot trigger; pulls the server-side token from env and forwards to orchestrator.
  const expected = Deno.env.get("STAGE4B_RUN_TOKEN");
  if (!expected) return new Response("not_configured", { status: 503, headers: CORS });
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/stage4b-test-orchestrator`;
  const body = req.method === "POST" ? await req.text() : "{}";
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "x-stage4b-token": expected,
    },
    body,
  });
  const text = await r.text();
  return new Response(text, { status: r.status, headers: { ...CORS, "content-type": "application/json" } });
});