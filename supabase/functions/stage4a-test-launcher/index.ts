/**
 * Stage 4A — тонкий launcher. Сам по себе не имеет привилегий: только читает
 * STAGE4A_RUN_TOKEN из env (доступно лишь внутри Edge Functions) и форвардит
 * запрос в stage4a-test-orchestrator с заголовком X-Stage4A-Run-Token.
 * Это позволяет агенту вызвать через curl_edge_functions, не зная значения
 * токена, но при этом orchestrator всё равно валидирует токен timing-safe
 * сравнением. Без env-доступа launcher не может предоставить токен → орк
 * не примет.
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405, headers: CORS });
  const token = Deno.env.get("STAGE4A_RUN_TOKEN");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  if (!token || !SUPABASE_URL) {
    return new Response(JSON.stringify({ error: "stage4a_not_configured" }), { status: 503, headers: { ...CORS, "Content-Type": "application/json" } });
  }
  const body = await req.text();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/stage4a-test-orchestrator`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Stage4A-Run-Token": token,
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""}`,
    },
    body: body || "{}",
  });
  const responseBody = await res.text();
  return new Response(responseBody, {
    status: res.status,
    headers: { ...CORS, "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
});