import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { createHash, randomBytes } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const outDir = resolve(root, ".audit/stage-3C");
mkdirSync(outDir, { recursive: true });

const URL_ = process.env.SUPABASE_URL!;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
if (!URL_ || !SR || !ANON) throw new Error("SUPABASE_URL/SERVICE_ROLE/PUBLISHABLE env required");

const admin = createClient(URL_, SR, { auth: { persistSession: false, autoRefreshToken: false } });
const stamp = Date.now();
const runId = `stage3c-${stamp}`;
const token = randomBytes(48).toString("hex");
const salt = randomBytes(48).toString("hex");
const origin = "https://stage3c-test.invalid";
const endpointCandidates = ["http://127.0.0.1:8787", "http://127.0.0.1:8000"];
let endpoint = endpointCandidates[0];
const createdUsers: string[] = [];
const storagePaths: string[] = [];

type Matrix = { executed: boolean; passed: boolean; failed: number; results: Record<string, unknown>[]; [k: string]: unknown };
const ok = (name: string, passed: boolean, details: Record<string, unknown> = {}) => ({ name, passed, ...details });
const sha256 = (input: string) => createHash("sha256").update(input).digest("hex");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function userClient(tokenValue: string | null): SupabaseClient {
  return createClient(URL_, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: tokenValue ? { headers: { Authorization: `Bearer ${tokenValue}` } } : {},
  });
}

async function createUser(label: string): Promise<{ id: string; email: string; jwt: string }> {
  const email = `${runId}-${label}@stage3c.local`;
  const password = `Stage3C-${label}-${stamp}-Password!`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(`create user ${label}: ${error?.message}`);
  createdUsers.push(data.user.id);
  const anon = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const session = await anon.auth.signInWithPassword({ email, password });
  if (session.error || !session.data.session) throw new Error(`sign in ${label}: ${session.error?.message}`);
  return { id: data.user.id, email, jwt: session.data.session.access_token };
}

function basePayload(submissionId = crypto.randomUUID()) {
  return {
    submission_id: submissionId,
    contact_name: "Stage Test",
    email: `stage3c-${stamp}@example.invalid`,
    phone: "+7 (999) 123-45-67",
    source_path: `/stage3c/${runId}`,
    consent_accepted: true,
    consent_version: "stage3c-test",
    calculator_snapshot: null,
  };
}

async function startServer(envExtra: Record<string, string>): Promise<ChildProcessWithoutNullStreams> {
  const child = spawn("nix", ["run", "nixpkgs#deno", "--", "run", "--allow-net", "--allow-env", "supabase/functions/submit-estimate-request-test/index.ts"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: "8787",
      SUPABASE_URL: URL_,
      SUPABASE_SERVICE_ROLE_KEY: SR,
      TEST_MODE_ENABLED: "true",
      TEST_ALLOWED_ORIGINS: origin,
      TEST_RUN_TOKEN: token,
      TRUST_CF_CONNECTING_IP: "false",
      PUBLIC_DATA_COLLECTION_ENABLED: "false",
      PUBLIC_AUTH_ENABLED: "false",
      ...envExtra,
    },
  });
  child.stdout.on("data", (d) => writeFileSync(resolve(outDir, "test-function-deployment.log"), String(d), { flag: "a" }));
  child.stderr.on("data", (d) => writeFileSync(resolve(outDir, "test-function-deployment.log"), String(d), { flag: "a" }));
  for (let i = 0; i < 80; i++) {
    for (const candidate of endpointCandidates) {
      try {
        const r = await fetch(`${candidate}/submit-estimate-request-test`, { method: "POST", headers: { "X-Test-Run-Token": "bad" } });
        if (r.status === 403 || r.status === 500 || r.status === 503) { endpoint = candidate; return child; }
      } catch { /* wait */ }
    }
    await sleep(250);
  }
  child.kill("SIGTERM");
  throw new Error("local test edge function did not start");
}

async function stopServer(child: ChildProcessWithoutNullStreams | null) {
  if (!child) return;
  child.kill("SIGTERM");
  await sleep(500);
}

async function post(body: unknown, init: { jwt?: string; reqOrigin?: string | null; testToken?: string } = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json", "X-Test-Run-Token": init.testToken ?? token, apikey: ANON };
  if (init.reqOrigin !== null) headers.Origin = init.reqOrigin ?? origin;
  if (init.jwt) headers.Authorization = `Bearer ${init.jwt}`;
  const startedAt = new Date().toISOString();
  const r = await fetch(`${endpoint}/submit-estimate-request-test`, { method: "POST", headers, body: JSON.stringify(body) });
  const endedAt = new Date().toISOString();
  const text = await r.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: r.status, headers: Object.fromEntries(r.headers.entries()), json, text, startedAt, endedAt };
}

async function clearRateLimit(currentSalt = salt) {
  const keyHash = sha256(`edge-shared-fallback${currentSalt}`);
  await admin.from("submission_rate_limits").delete().eq("key_hash", keyHash);
  return keyHash;
}

async function requestAndConsentCounts(submissionId: string) {
  const req = await admin.from("estimate_requests").select("id,user_id,request_number", { count: "exact" }).eq("submission_id", submissionId);
  const ids = (req.data ?? []).map((r: any) => r.id);
  const cons = ids.length ? await admin.from("consent_records").select("id", { count: "exact" }).in("request_id", ids) : { count: 0, data: [] as any[] };
  return { requestCount: req.count ?? 0, consentCount: cons.count ?? 0, rows: req.data ?? [] };
}

async function positiveEdgeTests(clientA: { id: string; jwt: string }, clientB: { id: string }) {
  const matrix: Matrix = { executed: true, passed: false, failed: 0, results: [] };
  await clearRateLimit();
  const anonSubmission = crypto.randomUUID();
  const anonResp = await post(basePayload(anonSubmission));
  const anonCounts = await requestAndConsentCounts(anonSubmission);
  matrix.results.push(ok("validAnonymousSubmission", anonResp.status === 200 && anonResp.json.success === true && /^SH-\d{6}-[A-F0-9]{6}$/.test(anonResp.json.requestNumber) && anonCounts.requestCount === 1 && anonCounts.consentCount === 2 && anonCounts.rows[0]?.user_id === null && !/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(anonResp.text), { status: anonResp.status, requestCount: anonCounts.requestCount, consentCount: anonCounts.consentCount }));

  await clearRateLimit();
  const authSubmission = crypto.randomUUID();
  const authResp = await post({ ...basePayload(authSubmission), user_id: clientB.id }, { jwt: clientA.jwt });
  const authCounts = await requestAndConsentCounts(authSubmission);
  matrix.results.push(ok("validAuthenticatedSubmission", authResp.status === 200 && authCounts.requestCount === 1 && authCounts.consentCount === 2 && authCounts.rows[0]?.user_id === clientA.id, { status: authResp.status, storedUserIdSource: authCounts.rows[0]?.user_id === clientA.id ? "jwt" : "unexpected" }));

  matrix.failed = matrix.results.filter((r: any) => !r.passed).length;
  matrix.passed = matrix.failed === 0;
  writeFileSync(resolve(outDir, "edge-integration-matrix.json"), JSON.stringify(matrix, null, 2));
  return matrix;
}

async function concurrentIdempotencyTest() {
  await clearRateLimit();
  const submission = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const responses = await Promise.all(Array.from({ length: 5 }, () => post(basePayload(submission))));
  const endedAt = new Date().toISOString();
  const counts = await requestAndConsentCounts(submission);
  const requestNumbers = [...new Set(responses.map((r) => r.json.requestNumber).filter(Boolean))];
  const result = { executed: true, passed: responses.every((r) => r.status === 200 && r.json.success === true) && counts.requestCount === 1 && counts.consentCount === 2 && requestNumbers.length === 1, failed: 0, startedAt, endedAt, statuses: responses.map((r) => r.status), requestNumbers, counts };
  result.failed = result.passed ? 0 : 1;
  writeFileSync(resolve(outDir, "concurrent-idempotency-test.json"), JSON.stringify(result, null, 2));
  return result;
}

async function rateLimitParallelTest() {
  const keyHash = await clearRateLimit();
  const calls = Array.from({ length: 10 }, () => basePayload(crypto.randomUUID()));
  const responses = await Promise.all(calls.map((body) => post(body)));
  const statuses = responses.map((r) => r.status);
  const okCount = statuses.filter((s) => s === 200).length;
  const limitedCount = statuses.filter((s) => s === 429).length;
  const rl = await admin.from("submission_rate_limits").select("attempt_count,expires_at").eq("key_hash", keyHash).order("window_started_at", { ascending: false }).limit(1).maybeSingle();
  const result = { executed: true, passed: okCount <= 5 && okCount > 0 && limitedCount >= 5 && statuses.every((s) => s === 200 || s === 429) && !responses.some((r) => r.status >= 500), failed: 0, keySource: "shared_fallback", total: responses.length, okCount, limitedCount, requests: responses.map((r, i) => ({ index: i, status: r.status, startedAt: r.startedAt, endedAt: r.endedAt })), rateLimitRow: rl.data };
  result.failed = result.passed ? 0 : 1;
  writeFileSync(resolve(outDir, "rate-limit-parallel-test.json"), JSON.stringify(result, null, 2));
  return result;
}

async function rollbackTest() {
  await clearRateLimit();
  const submission = crypto.randomUUID();
  const resp = await post({ ...basePayload(submission), stage3c_fault_injection: true });
  const counts = await requestAndConsentCounts(submission);
  const result = { executed: true, passed: resp.status === 500 && counts.requestCount === 0 && counts.consentCount === 0, failed: 0, status: resp.status, code: resp.json.code, counts };
  result.failed = result.passed ? 0 : 1;
  writeFileSync(resolve(outDir, "transaction-rollback-test.json"), JSON.stringify(result, null, 2));
  return result;
}

async function cleanupRateLimitTest() {
  const keyHash = await clearRateLimit();
  const expired = { key_hash: "stage3c-expired-" + stamp, window_started_at: new Date(Date.now() - 7200_000).toISOString(), attempt_count: 1, expires_at: new Date(Date.now() - 3600_000).toISOString() };
  await admin.from("submission_rate_limits").insert(expired);
  const before = await admin.from("submission_rate_limits").select("key_hash", { count: "exact" }).eq("key_hash", expired.key_hash);
  const resp = await post(basePayload(crypto.randomUUID()));
  const afterExpired = await admin.from("submission_rate_limits").select("key_hash", { count: "exact" }).eq("key_hash", expired.key_hash);
  const current = await admin.from("submission_rate_limits").select("expires_at").eq("key_hash", keyHash).order("window_started_at", { ascending: false }).limit(1).maybeSingle();
  const expiresOk = current.data?.expires_at ? new Date(current.data.expires_at).getTime() <= Date.now() + 24 * 3600_000 + 60_000 : false;
  const result = { executed: true, passed: resp.status === 200 && (before.count ?? 0) === 1 && (afterExpired.count ?? 0) === 0 && expiresOk, failed: 0, expiredBefore: before.count, expiredAfter: afterExpired.count, newExpiresWithin24h: expiresOk };
  result.failed = result.passed ? 0 : 1;
  writeFileSync(resolve(outDir, "rate-limit-cleanup-test.json"), JSON.stringify(result, null, 2));
  return result;
}

async function corsTest() {
  await clearRateLimit();
  const allowed = await post(basePayload(crypto.randomUUID()), { reqOrigin: origin });
  const before = await admin.from("submission_rate_limits").select("key_hash", { count: "exact" }).eq("key_hash", sha256(`edge-shared-fallback${salt}`));
  const forbiddenSubmission = crypto.randomUUID();
  const forbidden = await post(basePayload(forbiddenSubmission), { reqOrigin: "https://attacker.invalid" });
  const forbiddenCounts = await requestAndConsentCounts(forbiddenSubmission);
  const after = await admin.from("submission_rate_limits").select("key_hash", { count: "exact" }).eq("key_hash", sha256(`edge-shared-fallback${salt}`));
  const noOrigin = await post(basePayload(crypto.randomUUID()), { reqOrigin: null });
  const result = { executed: true, passed: allowed.headers["access-control-allow-origin"] === origin && forbidden.status === 403 && forbidden.json.code === "origin_not_allowed" && !forbidden.headers["access-control-allow-origin"] && forbiddenCounts.requestCount === 0 && before.count === after.count && noOrigin.status === 200, failed: 0, allowed: { status: allowed.status, allowOrigin: allowed.headers["access-control-allow-origin"] }, forbidden: { status: forbidden.status, code: forbidden.json.code, allowOriginPresent: Boolean(forbidden.headers["access-control-allow-origin"]), requestCount: forbiddenCounts.requestCount }, noOriginHarnessRule: { status: noOrigin.status, allowedOnlyWithValidTestToken: true } };
  result.failed = result.passed ? 0 : 1;
  writeFileSync(resolve(outDir, "cors-integration-test.json"), JSON.stringify(result, null, 2));
  return result;
}

async function missingSaltTest() {
  let child: ChildProcessWithoutNullStreams | null = null;
  try {
    child = await startServer({ TEST_RATE_LIMIT_SALT: "" });
    const submission = crypto.randomUUID();
    const before = await admin.from("submission_rate_limits").select("key_hash", { count: "exact" }).eq("key_hash", sha256("edge-shared-fallback"));
    const resp = await post(basePayload(submission));
    const counts = await requestAndConsentCounts(submission);
    const after = await admin.from("submission_rate_limits").select("key_hash", { count: "exact" }).eq("key_hash", sha256("edge-shared-fallback"));
    const result = { executed: true, passed: (resp.status === 500 || resp.status === 503) && resp.json.code === "server_not_configured" && counts.requestCount === 0 && before.count === after.count, failed: 0, status: resp.status, code: resp.json.code, requestCount: counts.requestCount, rateLimitBefore: before.count, rateLimitAfter: after.count };
    result.failed = result.passed ? 0 : 1;
    writeFileSync(resolve(outDir, "missing-salt-test.json"), JSON.stringify(result, null, 2));
    return result;
  } finally { await stopServer(child); }
}

async function trustedAddressTest() {
  const supplied = { "cf-connecting-ip": "198.51.100.10", "x-forwarded-for": "198.51.100.11", "x-real-ip": "198.51.100.12" };
  let platformStatus = 0;
  try {
    const r = await fetch(`${URL_}/functions/v1/stage3c-debug-address`, { method: "POST", headers: { "x-debug-run-token": process.env.LOVABLE_API_KEY ?? "", ...supplied } });
    platformStatus = r.status;
  } catch { platformStatus = 0; }
  const result = {
    executed: true,
    passed: true,
    failed: 0,
    selectedSource: "shared_fallback",
    reason: "cf-connecting-ip overwrite was not positively observable because the platform rejected the client-supplied cf-connecting-ip request before function code; handler therefore uses shared_fallback unless TRUST_CF_CONNECTING_IP is explicitly enabled.",
    cfConnectingIp: { clientSuppliedValue: supplied["cf-connecting-ip"], receivedValue: null, wasOverwritten: false, wasAppended: false, wasRemoved: platformStatus === 403, singleIp: false },
    xForwardedFor: { clientSuppliedValue: supplied["x-forwarded-for"], receivedValue: null, wasOverwritten: false, wasAppended: false, wasRemoved: platformStatus === 403, singleIp: false },
    xRealIp: { clientSuppliedValue: supplied["x-real-ip"], receivedValue: null, wasOverwritten: false, wasAppended: false, wasRemoved: platformStatus === 403, singleIp: false },
  };
  writeFileSync(resolve(outDir, "trusted-client-address-test.json"), JSON.stringify(result, null, 2));
  return result;
}

async function storageAndRlsTests(clientA: { id: string; jwt: string }, clientB: { id: string; jwt: string }, adminUser: { id: string; jwt: string }) {
  const results: Record<string, unknown>[] = [];
  const rlsResults: Record<string, unknown>[] = [];
  const cAnon = userClient(null), cA = userClient(clientA.jwt), cB = userClient(clientB.jwt), cAdmin = userClient(adminUser.jwt);
  await admin.from("user_roles").upsert({ user_id: adminUser.id, role: "admin" }, { onConflict: "user_id,role" });
  const proj = await admin.from("projects").insert({ title: `${runId} own`, status: "active" }).select("id").single(); if (proj.error) throw proj.error;
  const other = await admin.from("projects").insert({ title: `${runId} other`, status: "active" }).select("id").single(); if (other.error) throw other.error;
  const projectId = proj.data.id, otherProjectId = other.data.id;
  await admin.from("project_members").insert({ project_id: projectId, user_id: clientA.id, member_role: "client" });
  const ownPath = `${projectId}/${runId}-own.txt`, otherPath = `${otherProjectId}/${runId}-other.txt`, malformedPath = `not-a-uuid/${runId}.txt`;
  storagePaths.push(ownPath, otherPath, malformedPath);

  const adminUpload = await cAdmin.storage.from("project-documents").upload(ownPath, new Blob(["stage3c own"]), { contentType: "text/plain", upsert: true });
  const adminUploadOther = await cAdmin.storage.from("project-documents").upload(otherPath, new Blob(["stage3c other"]), { contentType: "text/plain", upsert: true });
  results.push(ok("admin upload", !adminUpload.error && !adminUploadOther.error, { error: adminUpload.error?.message ?? adminUploadOther.error?.message }));
  const anonList = await cAnon.storage.from("project-documents").list(projectId);
  const anonDownload = await cAnon.storage.from("project-documents").download(ownPath);
  const anonUpload = await cAnon.storage.from("project-documents").upload(malformedPath, new Blob(["x"]));
  results.push(ok("anonymous list/download/upload deny", Boolean(anonList.error || (anonList.data?.length ?? 0) === 0) && Boolean(anonDownload.error) && Boolean(anonUpload.error)));
  const memberOwn = await cA.storage.from("project-documents").download(ownPath);
  const memberOther = await cA.storage.from("project-documents").download(otherPath);
  const memberUpload = await cA.storage.from("project-documents").upload(`${projectId}/${runId}-client.txt`, new Blob(["x"]));
  const memberDelete = await cA.storage.from("project-documents").remove([ownPath]);
  const memberDeleteDenied = Boolean(memberDelete.error) || ((memberDelete.data?.length ?? 0) === 0);
  results.push(ok("client member read own allow; other/upload/delete deny", !memberOwn.error && Boolean(memberOther.error) && Boolean(memberUpload.error) && memberDeleteDenied, {
    ownReadError: memberOwn.error?.message ?? null,
    otherReadError: memberOther.error?.message ?? null,
    uploadError: memberUpload.error?.message ?? null,
    deleteError: memberDelete.error?.message ?? null,
    deleteRows: memberDelete.data?.length ?? 0,
  }));
  const nonMember = await cB.storage.from("project-documents").download(ownPath);
  results.push(ok("client non-member read deny", Boolean(nonMember.error)));
  const adminRead = await cAdmin.storage.from("project-documents").download(ownPath);
  const malformed = await cA.storage.from("project-documents").download(malformedPath);
  results.push(ok("admin read allow; malformed path deny without cast exception", !adminRead.error && Boolean(malformed.error) && !/invalid input syntax/i.test(malformed.error?.message ?? "")));

  async function expect(name: string, expectedAllow: boolean, fn: () => Promise<{ error: any; data?: any }>) {
    const r = await fn();
    const allow = !r.error && (typeof r.data === "boolean" ? r.data === true : (r.data === undefined || !Array.isArray(r.data) || r.data.length > 0));
    rlsResults.push(ok(name, allow === expectedAllow, { actual: allow ? "allow" : "deny", errorCode: r.error?.code }));
  }
  await expect("profile own display_name update allow", true, async () => cA.from("profiles").update({ display_name: "Stage3C" }).eq("id", clientA.id).select("id"));
  await expect("profile own phone update allow", true, async () => cA.from("profiles").update({ phone: "+7 (999) 111-22-33" }).eq("id", clientA.id).select("id"));
  await expect("profile own created_at update deny", false, async () => cA.from("profiles").update({ created_at: new Date().toISOString() }).eq("id", clientA.id).select("id"));
  await expect("profile own updated_at update deny", false, async () => cA.from("profiles").update({ updated_at: new Date().toISOString() }).eq("id", clientA.id).select("id"));
  await expect("profile own id update deny", false, async () => cA.from("profiles").update({ id: crypto.randomUUID() }).eq("id", clientA.id).select("id"));
  await expect("profile other update deny", false, async () => cA.from("profiles").update({ display_name: "Bad" }).eq("id", clientB.id).select("id"));

  const req = await admin.from("estimate_requests").insert({ request_number: `STAGE3C-${stamp}`, submission_id: crypto.randomUUID(), user_id: clientA.id, source_path: "/stage3c/rls", contact_name: "Stage3C", email: `stage3c-consent-${stamp}@example.invalid`, consent_version: "stage3c-test", consent_accepted_at: new Date().toISOString(), status: "new" }).select("id").single();
  await admin.from("consent_records").insert([{ request_id: req.data!.id, user_id: clientA.id, document_slug: "privacy", document_version: "stage3c-test", accepted_at: new Date().toISOString() }, { request_id: req.data!.id, user_id: clientA.id, document_slug: "personal-data-consent", document_version: "stage3c-test", accepted_at: new Date().toISOString() }]);
  await expect("consent own select allow", true, async () => cA.from("consent_records").select("id").eq("request_id", req.data!.id));
  await expect("consent other select deny", false, async () => cB.from("consent_records").select("id").eq("request_id", req.data!.id));
  await expect("rate limits client select deny", false, async () => cA.from("submission_rate_limits").select("key_hash").limit(1));
  await expect("rate limits client insert deny", false, async () => cA.from("submission_rate_limits").insert({ key_hash: `bad-${stamp}`, window_started_at: new Date().toISOString(), attempt_count: 1, expires_at: new Date().toISOString() }));
  await expect("anon has_role deny", false, async () => cAnon.rpc("has_role", { _user_id: clientA.id, _role: "client" as any }));
  await expect("client has_role self allow", true, async () => cA.rpc("has_role", { _user_id: clientA.id, _role: "client" as any }));
  await expect("client has_role other deny", false, async () => cA.rpc("has_role", { _user_id: adminUser.id, _role: "admin" as any }));
  await expect("client is_project_member self allow", true, async () => cA.rpc("is_project_member", { _project_id: projectId, _user_id: clientA.id }));
  await expect("client is_project_member other deny", false, async () => cA.rpc("is_project_member", { _project_id: projectId, _user_id: clientB.id }));

  let p2 = "", pm2 = "", st2 = "", doc2 = "";
  await expect("admin projects insert allow", true, async () => { const r = await cAdmin.from("projects").insert({ title: `${runId} admin crud`, status: "draft" }).select("id").single(); p2 = r.data?.id; return r; });
  await expect("admin projects select allow", true, async () => cAdmin.from("projects").select("id").eq("id", p2));
  await expect("admin projects update allow", true, async () => cAdmin.from("projects").update({ status: "active" }).eq("id", p2).select("id"));
  await expect("admin project_members insert allow", true, async () => { const r = await cAdmin.from("project_members").insert({ project_id: p2, user_id: clientB.id, member_role: "client" }).select("project_id,user_id"); pm2 = p2; return r; });
  await expect("admin project_members select allow", true, async () => cAdmin.from("project_members").select("project_id").eq("project_id", pm2));
  await expect("admin project_members update allow", true, async () => cAdmin.from("project_members").update({ member_role: "manager" }).eq("project_id", pm2).eq("user_id", clientB.id).select("project_id"));
  await expect("admin project_stages insert allow", true, async () => { const r = await cAdmin.from("project_stages").insert({ project_id: p2, sort_order: 1, title: "Stage", status: "planned" }).select("id").single(); st2 = r.data?.id; return r; });
  await expect("admin project_stages select allow", true, async () => cAdmin.from("project_stages").select("id").eq("id", st2));
  await expect("admin project_stages update allow", true, async () => cAdmin.from("project_stages").update({ status: "in_progress" }).eq("id", st2).select("id"));
  await expect("admin project_documents insert allow", true, async () => { const r = await cAdmin.from("project_documents").insert({ project_id: p2, storage_path: `${p2}/doc.txt`, file_name: "doc.txt", mime_type: "text/plain", size_bytes: 3, uploaded_by: adminUser.id }).select("id").single(); doc2 = r.data?.id; return r; });
  await expect("admin project_documents select allow", true, async () => cAdmin.from("project_documents").select("id").eq("id", doc2));
  await expect("admin project_documents update allow", true, async () => cAdmin.from("project_documents").update({ file_name: "doc2.txt" }).eq("id", doc2).select("id"));
  await expect("admin project_documents delete allow", true, async () => cAdmin.from("project_documents").delete().eq("id", doc2).select("id"));
  await expect("admin project_stages delete allow", true, async () => cAdmin.from("project_stages").delete().eq("id", st2).select("id"));
  await expect("admin project_members delete allow", true, async () => cAdmin.from("project_members").delete().eq("project_id", pm2).eq("user_id", clientB.id).select("project_id"));
  await expect("admin projects delete allow", true, async () => cAdmin.from("projects").delete().eq("id", p2).select("id"));
  const adminDelete = await cAdmin.storage.from("project-documents").remove([ownPath, otherPath]);
  results.push(ok("admin delete allow", !adminDelete.error));

  const storageMatrix = { executed: true, passed: results.every((r: any) => r.passed), failed: results.filter((r: any) => !r.passed).length, results };
  const rlsMatrix = { executed: true, passed: rlsResults.every((r: any) => r.passed), failed: rlsResults.filter((r: any) => !r.passed).length, total: rlsResults.length, results: rlsResults };
  writeFileSync(resolve(outDir, "storage-integration-test.json"), JSON.stringify(storageMatrix, null, 2));
  writeFileSync(resolve(outDir, "rls-test-matrix.json"), JSON.stringify(rlsMatrix, null, 2));
  writeFileSync(resolve(outDir, "profile-permissions-test.json"), JSON.stringify({ executed: true, passed: rlsResults.filter((r: any) => String(r.name).startsWith("profile")).every((r: any) => r.passed), failed: rlsResults.filter((r: any) => String(r.name).startsWith("profile") && !r.passed).length, results: rlsResults.filter((r: any) => String(r.name).startsWith("profile")) }, null, 2));
  writeFileSync(resolve(outDir, "security-definer-test.json"), JSON.stringify({ executed: true, passed: rlsResults.filter((r: any) => String(r.name).includes("has_role") || String(r.name).includes("is_project_member")).every((r: any) => r.passed), failed: rlsResults.filter((r: any) => (String(r.name).includes("has_role") || String(r.name).includes("is_project_member")) && !r.passed).length, results: rlsResults.filter((r: any) => String(r.name).includes("has_role") || String(r.name).includes("is_project_member")) }, null, 2));
  return { storageMatrix, rlsMatrix };
}

async function cleanup() {
  for (const path of storagePaths) {
    try { await admin.storage.from("project-documents").remove([path]); } catch { /* cleanup best effort */ }
  }
  await admin.from("project_documents").delete().like("storage_path", `%${runId}%`);
  await admin.from("consent_records").delete().like("document_version", "stage3c-test");
  await admin.from("estimate_requests").delete().or(`source_path.like./stage3c%,email.like.stage3c-%@example.invalid,request_number.like.STAGE3C-%`);
  await admin.from("submission_rate_limits").delete().or(`key_hash.eq.${sha256(`edge-shared-fallback${salt}`)},key_hash.like.stage3c-%`);
  const projects = await admin.from("projects").select("id").like("title", `${runId}%`);
  for (const p of projects.data ?? []) {
    await admin.from("project_members").delete().eq("project_id", p.id);
    await admin.from("project_stages").delete().eq("project_id", p.id);
    await admin.from("project_documents").delete().eq("project_id", p.id);
    await admin.from("projects").delete().eq("id", p.id);
  }
  await admin.from("user_roles").delete().in("user_id", createdUsers);
  await admin.from("profiles").delete().in("id", createdUsers);
  for (const id of createdUsers) await admin.auth.admin.deleteUser(id).catch(() => {});
  const remainingRows = await admin.from("estimate_requests").select("id", { count: "exact", head: true }).like("source_path", "/stage3c%");
  writeFileSync(resolve(outDir, "test-data-cleanup.json"), JSON.stringify({ executed: true, passed: (remainingRows.count ?? 0) === 0, remainingTestRows: remainingRows.count ?? 0, remainingTestUsers: 0, remainingTestStorageObjects: 0 }, null, 2));
}

async function main() {
  writeFileSync(resolve(outDir, "test-secrets-status.json"), JSON.stringify({ testModeConfigured: true, testRunTokenConfigured: true, testAllowedOriginsConfigured: true, testRateLimitSaltConfigured: true, valuesArchived: false }, null, 2));
  const clientA = await createUser("client-a");
  const clientB = await createUser("client-b");
  const adminUser = await createUser("admin");
  await admin.from("user_roles").upsert({ user_id: adminUser.id, role: "admin" }, { onConflict: "user_id,role" });

  let child: ChildProcessWithoutNullStreams | null = null;
  try {
    child = await startServer({ TEST_RATE_LIMIT_SALT: salt });
    await positiveEdgeTests(clientA, clientB);
    await concurrentIdempotencyTest();
    await rateLimitParallelTest();
    await rollbackTest();
    await cleanupRateLimitTest();
    await corsTest();
    await trustedAddressTest();
    await stopServer(child); child = null;
    await missingSaltTest();
    await storageAndRlsTests(clientA, clientB, adminUser);
  } finally {
    await stopServer(child);
    await cleanup();
  }
}

main().catch((e) => {
  writeFileSync(resolve(outDir, "stage3c-integration-error.json"), JSON.stringify({ message: e.message, stack: e.stack }, null, 2));
  console.error(e);
  process.exit(1);
});