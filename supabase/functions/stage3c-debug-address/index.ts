const TOKEN_MIN_LENGTH = 32;

function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  const len = Math.max(aa.length, bb.length);
  let diff = aa.length ^ bb.length;
  for (let i = 0; i < len; i++) diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

Deno.serve((req) => {
  const expected = Deno.env.get("LOVABLE_API_KEY") ?? "";
  const supplied = req.headers.get("x-debug-run-token") ?? "";
  if (expected.length < TOKEN_MIN_LENGTH || !constantTimeEqual(supplied, expected)) {
    return new Response(JSON.stringify({ success: false, code: "debug_access_denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const names = ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"];
  const headers = Object.fromEntries(names.map((name) => [name, req.headers.get(name)]));
  return new Response(JSON.stringify({ success: true, headers }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});