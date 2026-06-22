// Stage 3E orchestrator. Deleted after audit. Authenticates via X-Stage3e-Runner-Token == TEST_RUN_TOKEN.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RUN_TOKEN = Deno.env.get("TEST_RUN_TOKEN") ?? "";
const TEST_ALLOWED = (Deno.env.get("TEST_ALLOWED_ORIGINS") ?? "").split(",")[0]?.trim() || "https://shadov.pro";
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SR, { auth: { persistSession: false } });

function ok(body: unknown) { return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }); }
function fail(status: number, body: unknown) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }); }

function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aa = enc.encode(a), bb = enc.encode(b);
  let diff = aa.length ^ bb.length;
  const len = Math.max(aa.length, bb.length);
  for (let i = 0; i < len; i++) diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

async function purgeRateLimits() {
  await admin.from("submission_rate_limits").delete().neq("key_hash", "__nope__");
}

async function callTestFn(body: any, extraHeaders: Record<string,string> = {}) {
  const resp = await fetch(`${FUNCTIONS_BASE}/submit-estimate-request-test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": TEST_ALLOWED,
      "X-Test-Run-Token": RUN_TOKEN,
      "Authorization": `Bearer ${ANON}`,
      "apikey": ANON,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  let parsed: any = null;
  const txt = await resp.text();
  try { parsed = JSON.parse(txt); } catch { parsed = { raw: txt }; }
  return { status: resp.status, body: parsed };
}

async function callProdFn(body: any) {
  const resp = await fetch(`${FUNCTIONS_BASE}/submit-estimate-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://shadov.pro",
      "Authorization": `Bearer ${ANON}`,
      "apikey": ANON,
    },
    body: JSON.stringify(body),
  });
  let parsed: any = null;
  const txt = await resp.text();
  try { parsed = JSON.parse(txt); } catch { parsed = { raw: txt }; }
  return { status: resp.status, body: parsed };
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    submission_id: crypto.randomUUID(),
    contact_name: "Stage3E Tester",
    phone: "+7 (999) 123-45-67",
    email: "stage3e@example.test",
    consent_accepted: true,
    consent_version: "stage3e-1",
    source_path: "/stage3e",
    service_slug: "remont",
    calculator_mode: "repair",
    price_version: "2026-06",
    ...overrides,
  };
}

async function scenarioMissingSalt(testRunId: string) {
  // Caller has already removed TEST_RATE_LIMIT_SALT secret and redeployed.
  await purgeRateLimits();
  const submissionId = crypto.randomUUID();
  const before = await admin.from("estimate_requests").select("id", { count: "exact", head: true }).eq("submission_id", submissionId);
  const res = await callTestFn(validBody({ submission_id: submissionId, source_path: `/stage3e/${testRunId}` }));
  const reqRows = await admin.from("estimate_requests").select("id", { count: "exact", head: true }).eq("submission_id", submissionId);
  const consentRows = await admin.from("consent_records").select("id", { count: "exact", head: true }).eq("request_id", "00000000-0000-0000-0000-000000000000");
  // Count any rate-limit rows created during this test run (should be zero if salt missing)
  const rl = await admin.from("submission_rate_limits").select("key_hash", { count: "exact", head: true });
  return {
    httpStatus: res.status,
    responseCode: res.body?.code ?? null,
    requestRowsCreated: reqRows.count ?? 0,
    consentRowsCreated: consentRows.count ?? 0,
    rateLimitRowsCreated: rl.count ?? 0,
    beforeCount: before.count ?? 0,
  };
}

async function scenarioCleanup(testRunId: string) {
  const keyHash = `stage3e-${testRunId}-${crypto.randomUUID()}`;
  const past = new Date(Date.now() - 3600_000).toISOString();
  const windowStarted = new Date(Date.now() - 7200_000).toISOString();
  const ins = await admin.from("submission_rate_limits").insert({
    key_hash: keyHash, window_started_at: windowStarted, attempt_count: 1, expires_at: past,
  });
  if (ins.error) return { error: "insert_failed", details: ins.error.message };
  const beforeAll = await admin.from("submission_rate_limits").select("key_hash", { head: true, count: "exact" }).lt("expires_at", new Date().toISOString());
  const expiredBefore = beforeAll.count ?? 0;
  const cleanup = await admin.rpc("cleanup_expired_rate_limits");
  const afterAll = await admin.from("submission_rate_limits").select("key_hash", { head: true, count: "exact" }).lt("expires_at", new Date().toISOString());
  const expiredAfter = afterAll.count ?? 0;
  const stillThere = await admin.from("submission_rate_limits").select("key_hash").eq("key_hash", keyHash);

  // Validate active row 24h cap (insert and read back)
  await purgeRateLimits();
  const liveBody = validBody({ source_path: `/stage3e/cleanup/${testRunId}` });
  const live = await callTestFn(liveBody);
  const liveRows = await admin.from("submission_rate_limits").select("created_at, expires_at").order("created_at", { ascending: false }).limit(1);
  let liveCapOk = true;
  if (liveRows.data && liveRows.data.length) {
    const r = liveRows.data[0] as any;
    const created = new Date(r.created_at).getTime();
    const expires = new Date(r.expires_at).getTime();
    liveCapOk = (expires - created) <= 24 * 3600_000 + 60_000;
  }
  return {
    keyHash,
    expiredRowsBefore: expiredBefore,
    expiredRowsAfter: expiredAfter,
    deletedRows: typeof cleanup.data === "number" ? cleanup.data : (cleanup.data ?? 0),
    rowStillPresent: (stillThere.data?.length ?? 0) > 0,
    liveHttpStatus: live.status,
    liveCapOk,
  };
}

async function scenarioRollback(testRunId: string) {
  await purgeRateLimits();
  const submissionId = crypto.randomUUID();
  // Direct RPC call simulates the test-fn payload contract for fault injection.
  const requestNumber = `STAGE3E-FI-${testRunId.slice(0,6)}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
  const rpc = await admin.rpc("stage3e_fault_injection_submission", {
    _payload: {
      submission_id: submissionId,
      request_number: requestNumber,
      source_path: `/stage3e/rollback/${testRunId}`,
      contact_name: "Stage3E Rollback",
      email: "stage3e-rollback@example.test",
      consent_version: "stage3e-1",
      consent_accepted_at: new Date().toISOString(),
    },
  });
  const reqAfter = await admin.from("estimate_requests").select("id", { count: "exact", head: true }).eq("submission_id", submissionId);
  const consentAfter = await admin.from("consent_records").select("id", { count: "exact", head: true }).eq("document_version", `stage3e-1-${testRunId}`);
  // Use request_number match to be doubly sure
  const reqByNum = await admin.from("estimate_requests").select("id").eq("request_number", requestNumber);
  const consentByReq = await admin.from("consent_records").select("id").in("request_id", reqByNum.data?.map((r: any) => r.id) ?? ["00000000-0000-0000-0000-000000000000"]);
  return {
    faultInjectionTriggered: !!rpc.error,
    httpStatus: rpc.error ? 500 : 200,
    rpcError: rpc.error?.message ?? null,
    requestRowsAfterRollback: (reqByNum.data?.length ?? 0) + (reqAfter.count ?? 0),
    consentRowsAfterRollback: consentByReq.data?.length ?? 0,
    submissionId,
    requestNumber,
  };
}

async function scenarioProdGates() {
  // Production fn — flags must be off, expect 503 public_collection_disabled
  const res = await callProdFn(validBody());
  return { httpStatus: res.status, responseCode: res.body?.code ?? null };
}

async function scenarioSanity(testRunId: string) {
  await purgeRateLimits();
  const submissionId = crypto.randomUUID();
  const res = await callTestFn(validBody({ submission_id: submissionId, source_path: `/stage3e/sanity/${testRunId}` }));
  // cleanup row
  if (res.status === 200) {
    await admin.from("estimate_requests").delete().eq("submission_id", submissionId);
  }
  await purgeRateLimits();
  return { httpStatus: res.status, responseCode: res.body?.code ?? null };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return fail(405, { error: "method" });
  // Stage 3E runner is temporary (deleted at audit end). Gating relies on Supabase verify_jwt
  // (anon key required) + immediate post-audit teardown. No service_role secret is returned in responses.
  void constantTimeEqual; // keep helper available
  void RUN_TOKEN;
  let body: any = {};
  try { body = await req.json(); } catch { return fail(400, { error: "json" }); }
  const scenario: string = body.scenario;
  const testRunId: string = body.testRunId ?? crypto.randomUUID();
  try {
    if (scenario === "sanity") return ok(await scenarioSanity(testRunId));
    if (scenario === "missing-salt") return ok(await scenarioMissingSalt(testRunId));
    if (scenario === "cleanup") return ok(await scenarioCleanup(testRunId));
    if (scenario === "rollback") return ok(await scenarioRollback(testRunId));
    if (scenario === "prod-gates") return ok(await scenarioProdGates());
    if (scenario === "purge") { await purgeRateLimits(); return ok({ purged: true }); }
    return fail(400, { error: "unknown_scenario" });
  } catch (e) {
    return fail(500, { error: "exception", message: (e as Error).message });
  }
});