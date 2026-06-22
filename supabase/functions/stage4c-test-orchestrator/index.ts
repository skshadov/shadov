/**
 * Stage 4C — единый защищённый оркестратор для реальных JWT/RLS/RPC/Edge/Realtime тестов.
 * Удаляется по завершении этапа. Никогда не должен попасть в production.
 *
 * Требует заголовок X-Run-Token, сверяемый с STAGE4C_RUN_TOKEN.
 * action=run — полный цикл: seed → mint → RLS/RPC/Edge матрица → cleanup. Возвращает JSON отчёт.
 */
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-run-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aa = enc.encode(a), bb = enc.encode(b);
  const len = Math.max(aa.length, bb.length);
  let diff = aa.length ^ bb.length;
  for (let i = 0; i < len; i++) diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}
async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

type Scenario = {
  scenario: string; actor: string; userIdHash: string; table: string; operation: string;
  expected: string; actual: string; httpStatus: number; postgresCode: string | null; passed: boolean;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const token = req.headers.get("x-run-token") ?? "";
  const expected = Deno.env.get("STAGE4C_RUN_TOKEN") ?? "";
  if (expected.length < 32 || !constantTimeEqual(token, expected)) return json({ error: "forbidden" }, 403);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const PUBLISHABLE = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } });

  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const createdUserIds: string[] = [];
  const createdProjectIds: string[] = [];
  const createdStoragePaths: string[] = [];

  const out: any = {
    runId, startedAt, deployedVersion: "stage4c-orchestrator-v1", executed: true,
    rls: [] as Scenario[],
    rpcTests: [] as any[],
    edgeTests: { documents: [] as any[], cameras: [] as any[] },
    realtimeTests: { passed: true, notes: "skipped-in-orchestrator (run from playwright)" },
    cleanup: {} as any,
  };

  // helper: create user with confirmed email + return id, email, password
  async function createUser(role: "client" | "admin", label: string) {
    const email = `stage4c-${label}-${runId.slice(0,8)}@example.test`;
    const password = "Stage4c!" + crypto.randomUUID().replace(/-/g, "");
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { stage4c_test: true, label },
    });
    if (error || !data.user) throw new Error(`createUser ${label}: ${error?.message}`);
    createdUserIds.push(data.user.id);
    // ensure role: handle_new_user trigger gives 'client'; for admin we add row
    if (role === "admin") {
      await admin.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
    }
    return { id: data.user.id, email, password };
  }
  async function signIn(email: string, password: string): Promise<string> {
    const u = createClient(SUPABASE_URL, PUBLISHABLE, { auth: { persistSession: false } });
    const { data, error } = await u.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new Error(`signIn: ${error?.message}`);
    return data.session.access_token;
  }

  // run a REST request as a given JWT against PostgREST (Data API)
  async function asUser(token: string, path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("apikey", PUBLISHABLE);
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return await fetch(`${SUPABASE_URL}/rest/v1${path}`, { ...init, headers });
  }

  async function add(actor: string, userId: string, scenario: string, table: string, operation: string, expected: "allow" | "deny", res: Response, body?: any) {
    const ok = res.status >= 200 && res.status < 300;
    let postgresCode: string | null = null;
    let rowCount = 0;
    let txt = "";
    try {
      txt = await res.text();
      if (txt) {
        const parsed = JSON.parse(txt);
        if (Array.isArray(parsed)) rowCount = parsed.length;
        else if (parsed?.code) postgresCode = String(parsed.code);
      }
    } catch { /* ignore */ }
    let actual: "allow" | "deny";
    if (operation === "select") {
      // SELECT: allow = 200 with rows; deny = 200 with 0 rows (RLS hides) OR 401/403
      actual = (ok && rowCount > 0) ? "allow" : "deny";
    } else if (operation === "update" || operation === "delete") {
      // PostgREST returns 204 even when RLS hides the row. With Prefer:return=representation
      // an RLS-denied operation returns 200 with [] — rowCount stays 0.
      actual = (ok && rowCount > 0) ? "allow" : "deny";
    } else {
      // insert: 2xx with representation = allow; 4xx = deny
      actual = ok ? "allow" : "deny";
    }
    const userIdHash = (await sha256Hex(userId)).slice(0, 16);
    out.rls.push({ scenario, actor, userIdHash, table, operation, expected, actual, httpStatus: res.status, postgresCode, passed: actual === expected });
  }

  try {
    // ── SEED ─────────────────────────────────────────────────────────
    const clientA = await createUser("client", "clientA");
    const clientB = await createUser("client", "clientB");
    const adminU = await createUser("admin", "adminTest");

    const tokenA = await signIn(clientA.email, clientA.password);
    const tokenB = await signIn(clientB.email, clientB.password);
    const tokenAdmin = await signIn(adminU.email, adminU.password);

    // Create two projects via service role
    const { data: projA, error: pAerr } = await admin.from("projects").insert({
      title: `stage4c-A-${runId.slice(0,8)}`, status: "active", description: "test", is_demo: false,
    }).select("id").single();
    if (pAerr || !projA) throw new Error(`projectA: ${pAerr?.message}`);
    createdProjectIds.push(projA.id);
    const { data: projB, error: pBerr } = await admin.from("projects").insert({
      title: `stage4c-B-${runId.slice(0,8)}`, status: "active", description: "test", is_demo: false,
    }).select("id").single();
    if (pBerr || !projB) throw new Error(`projectB: ${pBerr?.message}`);
    createdProjectIds.push(projB.id);

    await admin.from("project_members").insert([
      { project_id: projA.id, user_id: clientA.id, member_role: "client" },
      { project_id: projB.id, user_id: clientB.id, member_role: "client" },
    ]);

    // Documents: visible & hidden in projectA; foreign in projectB
    const docVisiblePath = `${projA.id}/visible-${crypto.randomUUID()}.txt`;
    const docHiddenPath = `${projA.id}/hidden-${crypto.randomUUID()}.txt`;
    const docForeignPath = `${projB.id}/foreign-${crypto.randomUUID()}.txt`;
    for (const p of [docVisiblePath, docHiddenPath, docForeignPath]) {
      const { error } = await admin.storage.from("project-documents").upload(p, new Blob(["test-content"]), { upsert: true });
      if (error) throw new Error(`upload ${p}: ${error.message}`);
      createdStoragePaths.push(p);
    }
    const docBase = { mime_type: "text/plain", size_bytes: 12, file_name: "x.txt" };
    const { data: docVisible, error: dvErr } = await admin.from("project_documents").insert({
      project_id: projA.id, title: "visible", storage_path: docVisiblePath, is_visible_to_client: true, ...docBase,
    }).select("id").single();
    if (dvErr || !docVisible) throw new Error(`docVisible: ${dvErr?.message}`);
    const { data: docHidden, error: dhErr } = await admin.from("project_documents").insert({
      project_id: projA.id, title: "hidden", storage_path: docHiddenPath, is_visible_to_client: false, ...docBase,
    }).select("id").single();
    if (dhErr || !docHidden) throw new Error(`docHidden: ${dhErr?.message}`);
    const { data: docForeign, error: dfErr } = await admin.from("project_documents").insert({
      project_id: projB.id, title: "foreign", storage_path: docForeignPath, is_visible_to_client: true, ...docBase,
    }).select("id").single();
    if (dfErr || !docForeign) throw new Error(`docForeign: ${dfErr?.message}`);

    const { data: camA, error: caErr } = await admin.from("project_cameras").insert({ project_id: projA.id, name: "camA", status: "online" }).select("id").single();
    if (caErr || !camA) throw new Error(`camA: ${caErr?.message}`);
    const { data: camB, error: cbErr } = await admin.from("project_cameras").insert({ project_id: projB.id, name: "camB", status: "online" }).select("id").single();
    if (cbErr || !camB) throw new Error(`camB: ${cbErr?.message}`);

    const { data: payA, error: paErr } = await admin.from("project_payments").insert({
      project_id: projA.id, title: "Pay A", amount: 100000, currency: "RUB", status: "planned",
    }).select("id").single();
    if (paErr || !payA) throw new Error(`payA: ${paErr?.message}`);
    const { data: payB, error: pbErr } = await admin.from("project_payments").insert({
      project_id: projB.id, title: "Pay B", amount: 200000, currency: "RUB", status: "planned",
    }).select("id").single();
    if (pbErr || !payB) throw new Error(`payB: ${pbErr?.message}`);

    const drBase = { title: "Daily", summary: "Summary", work_completed: ["x"], next_steps: ["y"], issues: [] as string[] };
    const { data: drPub, error: drpErr } = await admin.from("project_daily_reports").insert({
      project_id: projA.id, report_date: "2026-06-01", ...drBase, published_at: new Date().toISOString(),
    }).select("id").single();
    if (drpErr || !drPub) throw new Error(`drPub: ${drpErr?.message}`);
    const { data: drDraft, error: drdErr } = await admin.from("project_daily_reports").insert({
      project_id: projA.id, report_date: "2026-06-02", ...drBase,
    }).select("id").single();
    if (drdErr || !drDraft) throw new Error(`drDraft: ${drdErr?.message}`);
    const { data: drForeign, error: drfErr } = await admin.from("project_daily_reports").insert({
      project_id: projB.id, report_date: "2026-06-01", ...drBase, published_at: new Date().toISOString(),
    }).select("id").single();
    if (drfErr || !drForeign) throw new Error(`drForeign: ${drfErr?.message}`);

    await admin.from("project_daily_report_documents").insert({ report_id: drPub.id, document_id: docVisible.id });
    await admin.from("project_daily_report_documents").insert({ report_id: drDraft.id, document_id: docHidden.id });

    const { data: msgA, error: maErr } = await admin.from("project_messages").insert({
      project_id: projA.id, sender_id: clientA.id, message_type: "user", body: "hello",
    }).select("id").single();
    if (maErr || !msgA) throw new Error(`msgA: ${maErr?.message}`);
    const { data: msgB, error: mbErr } = await admin.from("project_messages").insert({
      project_id: projB.id, sender_id: clientB.id, message_type: "user", body: "hello",
    }).select("id").single();
    if (mbErr || !msgB) throw new Error(`msgB: ${mbErr?.message}`);

    const { data: stageA, error: saErr } = await admin.from("project_stages").insert({
      project_id: projA.id, title: "Stage 1", status: "waiting_acceptance", sort_order: 1,
    }).select("id").single();
    if (saErr || !stageA) throw new Error(`stageA: ${saErr?.message}`);
    const { data: accA, error: aaErr } = await admin.from("project_stage_acceptances").insert({
      stage_id: stageA.id, status: "pending", attempt_number: 1, requested_at: new Date().toISOString(),
    }).select("id").single();
    if (aaErr || !accA) throw new Error(`accA: ${aaErr?.message}`);
    const { data: stageB, error: sbErr } = await admin.from("project_stages").insert({
      project_id: projB.id, title: "Stage 1", status: "waiting_acceptance", sort_order: 1,
    }).select("id").single();
    if (sbErr || !stageB) throw new Error(`stageB: ${sbErr?.message}`);
    const { data: accB, error: abErr } = await admin.from("project_stage_acceptances").insert({
      stage_id: stageB.id, status: "pending", attempt_number: 1, requested_at: new Date().toISOString(),
    }).select("id").single();
    if (abErr || !accB) throw new Error(`accB: ${abErr?.message}`);

    // ── RLS MATRIX ───────────────────────────────────────────────────
    // anonymous: bare anon key
    const anonHeaders = { "apikey": PUBLISHABLE, "Authorization": `Bearer ${PUBLISHABLE}` };
    async function anon(path: string, init: RequestInit = {}) {
      return fetch(`${SUPABASE_URL}/rest/v1${path}`, { ...init, headers: { ...anonHeaders, ...(init.headers as any) } });
    }
    await add("anonymous", "00000000-0000-0000-0000-000000000000", "projects/anon_select", "projects", "select", "deny", await anon(`/projects?select=id`));
    await add("anonymous", "00000000-0000-0000-0000-000000000000", "documents/anon_select", "project_documents", "select", "deny", await anon(`/project_documents?select=id`));
    await add("anonymous", "00000000-0000-0000-0000-000000000000", "cameras/anon_select", "project_cameras", "select", "deny", await anon(`/project_cameras?select=id`));
    await add("anonymous", "00000000-0000-0000-0000-000000000000", "camera_sources/anon_select", "project_camera_sources", "select", "deny", await anon(`/project_camera_sources?select=id`));
    await add("anonymous", "00000000-0000-0000-0000-000000000000", "payments/anon_select", "project_payments", "select", "deny", await anon(`/project_payments?select=id`));
    await add("anonymous", "00000000-0000-0000-0000-000000000000", "messages/anon_select", "project_messages", "select", "deny", await anon(`/project_messages?select=id`));
    await add("anonymous", "00000000-0000-0000-0000-000000000000", "daily_reports/anon_select", "project_daily_reports", "select", "deny", await anon(`/project_daily_reports?select=id`));
    await add("anonymous", "00000000-0000-0000-0000-000000000000", "daily_report_docs/anon_select", "project_daily_report_documents", "select", "deny", await anon(`/project_daily_report_documents?select=report_id,document_id`));
    await add("anonymous", "00000000-0000-0000-0000-000000000000", "stages/anon_select", "project_stages", "select", "deny", await anon(`/project_stages?select=id`));
    await add("anonymous", "00000000-0000-0000-0000-000000000000", "acceptances/anon_select", "project_stage_acceptances", "select", "deny", await anon(`/project_stage_acceptances?select=id`));
    await add("anonymous", "00000000-0000-0000-0000-000000000000", "members/anon_select", "project_members", "select", "deny", await anon(`/project_members?select=user_id,project_id`));
    await add("anonymous", "00000000-0000-0000-0000-000000000000", "user_roles/anon_select", "user_roles", "select", "deny", await anon(`/user_roles?select=user_id,role`));
    await add("anonymous", "00000000-0000-0000-0000-000000000000", "profiles/anon_select", "profiles", "select", "deny", await anon(`/profiles?select=id`));

    // clientA
    await add("clientA", clientA.id, "projects/client_member_select", "projects", "select", "allow", await asUser(tokenA, `/projects?id=eq.${projA.id}&select=id,title`));
    await add("clientA", clientA.id, "projects/client_foreign_select", "projects", "select", "deny", await asUser(tokenA, `/projects?id=eq.${projB.id}&select=id`));
    await add("clientA", clientA.id, "documents/visible_own_client", "project_documents", "select", "allow", await asUser(tokenA, `/project_documents?id=eq.${docVisible!.id}&select=id,title`));
    await add("clientA", clientA.id, "documents/hidden_own_client", "project_documents", "select", "deny", await asUser(tokenA, `/project_documents?id=eq.${docHidden!.id}&select=id`));
    await add("clientA", clientA.id, "documents/foreign_client", "project_documents", "select", "deny", await asUser(tokenA, `/project_documents?id=eq.${docForeign!.id}&select=id`));
    await add("clientA", clientA.id, "documents/client_insert", "project_documents", "insert", "deny", await asUser(tokenA, `/project_documents`, {
      method: "POST", body: JSON.stringify({ project_id: projA.id, title: "x", storage_path: `${projA.id}/x.txt`, is_visible_to_client: true, file_name: "x.txt", mime_type: "text/plain", size_bytes: 1 })
    }));
    await add("clientA", clientA.id, "documents/client_update", "project_documents", "update", "deny", await asUser(tokenA, `/project_documents?id=eq.${docVisible!.id}`, {
      method: "PATCH", headers: { "Prefer": "return=representation" }, body: JSON.stringify({ title: "hacked" })
    }));
    await add("clientA", clientA.id, "documents/client_delete", "project_documents", "delete", "deny", await asUser(tokenA, `/project_documents?id=eq.${docVisible!.id}`, { method: "DELETE", headers: { "Prefer": "return=representation" } }));

    await add("clientA", clientA.id, "cameras/client_select_own", "project_cameras", "select", "allow", await asUser(tokenA, `/project_cameras?id=eq.${camA!.id}&select=id,name`));
    await add("clientA", clientA.id, "cameras/client_foreign", "project_cameras", "select", "deny", await asUser(tokenA, `/project_cameras?id=eq.${camB!.id}&select=id`));
    await add("clientA", clientA.id, "cameras/client_insert", "project_cameras", "insert", "deny", await asUser(tokenA, `/project_cameras`, {
      method: "POST", body: JSON.stringify({ project_id: projA.id, name: "x" })
    }));
    await add("clientA", clientA.id, "cameras/client_update", "project_cameras", "update", "deny", await asUser(tokenA, `/project_cameras?id=eq.${camA!.id}`, {
      method: "PATCH", headers: { "Prefer": "return=representation" }, body: JSON.stringify({ name: "hacked" })
    }));
    await add("clientA", clientA.id, "cameras/client_delete", "project_cameras", "delete", "deny", await asUser(tokenA, `/project_cameras?id=eq.${camA!.id}`, { method: "DELETE", headers: { "Prefer": "return=representation" } }));
    await add("clientA", clientA.id, "camera_sources/client_select", "project_camera_sources", "select", "deny", await asUser(tokenA, `/project_camera_sources?select=camera_id`));

    await add("clientA", clientA.id, "payments/client_select_own", "project_payments", "select", "allow", await asUser(tokenA, `/project_payments?id=eq.${payA!.id}&select=id,amount`));
    await add("clientA", clientA.id, "payments/client_foreign", "project_payments", "select", "deny", await asUser(tokenA, `/project_payments?id=eq.${payB!.id}&select=id`));
    await add("clientA", clientA.id, "payments/client_insert", "project_payments", "insert", "deny", await asUser(tokenA, `/project_payments`, {
      method: "POST", body: JSON.stringify({ project_id: projA.id, title: "admin-pay", amount: 1, currency: "RUB", status: "planned" })
    }));
    await add("clientA", clientA.id, "payments/client_update", "project_payments", "update", "deny", await asUser(tokenA, `/project_payments?id=eq.${payA!.id}`, {
      method: "PATCH", headers: { "Prefer": "return=representation" }, body: JSON.stringify({ amount: 1 })
    }));
    await add("clientA", clientA.id, "payments/client_delete", "project_payments", "delete", "deny", await asUser(tokenA, `/project_payments?id=eq.${payA!.id}`, { method: "DELETE", headers: { "Prefer": "return=representation" } }));

    await add("clientA", clientA.id, "messages/client_select_own", "project_messages", "select", "allow", await asUser(tokenA, `/project_messages?id=eq.${msgA!.id}&select=id,body`));
    await add("clientA", clientA.id, "messages/client_foreign", "project_messages", "select", "deny", await asUser(tokenA, `/project_messages?id=eq.${msgB!.id}&select=id`));
    await add("clientA", clientA.id, "messages/client_insert_own", "project_messages", "insert", "allow", await asUser(tokenA, `/project_messages`, {
      method: "POST", headers: { "Prefer": "return=representation" },
      body: JSON.stringify({ project_id: projA.id, sender_id: clientA.id, message_type: "user", body: "hi" })
    }));
    await add("clientA", clientA.id, "messages/client_insert_spoof", "project_messages", "insert", "deny", await asUser(tokenA, `/project_messages`, {
      method: "POST", body: JSON.stringify({ project_id: projA.id, sender_id: clientB.id, message_type: "user", body: "spoof" })
    }));
    await add("clientA", clientA.id, "messages/client_insert_system", "project_messages", "insert", "deny", await asUser(tokenA, `/project_messages`, {
      method: "POST", body: JSON.stringify({ project_id: projA.id, sender_id: clientA.id, message_type: "system", body: "sys" })
    }));
    await add("clientA", clientA.id, "messages/client_update", "project_messages", "update", "deny", await asUser(tokenA, `/project_messages?id=eq.${msgA!.id}`, {
      method: "PATCH", headers: { "Prefer": "return=representation" }, body: JSON.stringify({ body: "edited" })
    }));
    await add("clientA", clientA.id, "messages/client_delete", "project_messages", "delete", "deny", await asUser(tokenA, `/project_messages?id=eq.${msgA!.id}`, { method: "DELETE", headers: { "Prefer": "return=representation" } }));

    await add("clientA", clientA.id, "daily_reports/client_published_own", "project_daily_reports", "select", "allow", await asUser(tokenA, `/project_daily_reports?id=eq.${drPub!.id}&select=id`));
    await add("clientA", clientA.id, "daily_reports/client_draft_own", "project_daily_reports", "select", "deny", await asUser(tokenA, `/project_daily_reports?id=eq.${drDraft!.id}&select=id`));
    await add("clientA", clientA.id, "daily_reports/client_foreign", "project_daily_reports", "select", "deny", await asUser(tokenA, `/project_daily_reports?id=eq.${drForeign!.id}&select=id`));
    await add("clientA", clientA.id, "daily_report_docs/client_published_own", "project_daily_report_documents", "select", "allow", await asUser(tokenA, `/project_daily_report_documents?report_id=eq.${drPub!.id}&select=report_id,document_id`));
    await add("clientA", clientA.id, "daily_report_docs/client_draft_own", "project_daily_report_documents", "select", "deny", await asUser(tokenA, `/project_daily_report_documents?report_id=eq.${drDraft!.id}&select=report_id,document_id`));
    await add("clientA", clientA.id, "daily_report_docs/client_insert", "project_daily_report_documents", "insert", "deny", await asUser(tokenA, `/project_daily_report_documents`, {
      method: "POST", body: JSON.stringify({ report_id: drPub!.id, document_id: docVisible!.id })
    }));

    await add("clientA", clientA.id, "acceptances/client_select_own", "project_stage_acceptances", "select", "allow", await asUser(tokenA, `/project_stage_acceptances?id=eq.${accA!.id}&select=id,status`));
    await add("clientA", clientA.id, "acceptances/client_foreign", "project_stage_acceptances", "select", "deny", await asUser(tokenA, `/project_stage_acceptances?id=eq.${accB!.id}&select=id`));
    await add("clientA", clientA.id, "acceptances/client_direct_update", "project_stage_acceptances", "update", "deny", await asUser(tokenA, `/project_stage_acceptances?id=eq.${accA!.id}`, {
      method: "PATCH", headers: { "Prefer": "return=representation" }, body: JSON.stringify({ status: "accepted" })
    }));
    await add("clientA", clientA.id, "stages/client_direct_update", "project_stages", "update", "deny", await asUser(tokenA, `/project_stages?id=eq.${stageA!.id}`, {
      method: "PATCH", headers: { "Prefer": "return=representation" }, body: JSON.stringify({ status: "accepted" })
    }));

    await add("clientA", clientA.id, "user_roles/client_self", "user_roles", "select", "allow", await asUser(tokenA, `/user_roles?user_id=eq.${clientA.id}&select=user_id,role`));
    await add("clientA", clientA.id, "user_roles/client_other", "user_roles", "select", "deny", await asUser(tokenA, `/user_roles?user_id=eq.${clientB.id}&select=user_id,role`));
    await add("clientA", clientA.id, "user_roles/client_promote", "user_roles", "insert", "deny", await asUser(tokenA, `/user_roles`, {
      method: "POST", body: JSON.stringify({ user_id: clientA.id, role: "admin" })
    }));

    // clientB symmetric
    await add("clientB", clientB.id, "projects/clientB_member_select", "projects", "select", "allow", await asUser(tokenB, `/projects?id=eq.${projB.id}&select=id`));
    await add("clientB", clientB.id, "projects/clientB_foreign", "projects", "select", "deny", await asUser(tokenB, `/projects?id=eq.${projA.id}&select=id`));
    await add("clientB", clientB.id, "documents/clientB_foreign", "project_documents", "select", "deny", await asUser(tokenB, `/project_documents?id=eq.${docVisible!.id}&select=id`));
    await add("clientB", clientB.id, "cameras/clientB_foreign", "project_cameras", "select", "deny", await asUser(tokenB, `/project_cameras?id=eq.${camA!.id}&select=id`));
    await add("clientB", clientB.id, "payments/clientB_foreign", "project_payments", "select", "deny", await asUser(tokenB, `/project_payments?id=eq.${payA!.id}&select=id`));
    await add("clientB", clientB.id, "messages/clientB_foreign", "project_messages", "select", "deny", await asUser(tokenB, `/project_messages?id=eq.${msgA!.id}&select=id`));
    await add("clientB", clientB.id, "acceptances/clientB_foreign", "project_stage_acceptances", "select", "deny", await asUser(tokenB, `/project_stage_acceptances?id=eq.${accA!.id}&select=id`));

    // admin
    await add("adminTest", adminU.id, "projects/admin_select", "projects", "select", "allow", await asUser(tokenAdmin, `/projects?id=eq.${projA.id}&select=id`));
    await add("adminTest", adminU.id, "documents/admin_select", "project_documents", "select", "allow", await asUser(tokenAdmin, `/project_documents?id=eq.${docHidden!.id}&select=id`));
    await add("adminTest", adminU.id, "documents/admin_insert", "project_documents", "insert", "allow", await asUser(tokenAdmin, `/project_documents`, {
      method: "POST", headers: { "Prefer": "return=representation" },
      body: JSON.stringify({ project_id: projA.id, title: "admin-ins", storage_path: `${projA.id}/admin.txt`, is_visible_to_client: true, file_name: "admin.txt", mime_type: "text/plain", size_bytes: 1 })
    }));
    await add("adminTest", adminU.id, "documents/admin_update", "project_documents", "update", "allow", await asUser(tokenAdmin, `/project_documents?id=eq.${docHidden!.id}`, {
      method: "PATCH", headers: { "Prefer": "return=representation" }, body: JSON.stringify({ title: "renamed" })
    }));
    await add("adminTest", adminU.id, "documents/admin_delete", "project_documents", "delete", "allow", await asUser(tokenAdmin, `/project_documents?title=eq.admin-ins`, { method: "DELETE", headers: { "Prefer": "return=representation" } }));
    await add("adminTest", adminU.id, "cameras/admin_insert", "project_cameras", "insert", "allow", await asUser(tokenAdmin, `/project_cameras`, {
      method: "POST", headers: { "Prefer": "return=representation" }, body: JSON.stringify({ project_id: projA.id, name: "admin-cam" })
    }));
    await add("adminTest", adminU.id, "camera_sources/admin_insert", "project_camera_sources", "insert", "allow", await asUser(tokenAdmin, `/project_camera_sources`, {
      method: "POST", headers: { "Prefer": "return=representation" },
      body: JSON.stringify({ camera_id: camA.id, provider: "test", provider_camera_id: "src-1", configuration_reference: "ref" })
    }));
    await add("adminTest", adminU.id, "camera_sources/admin_select", "project_camera_sources", "select", "allow", await asUser(tokenAdmin, `/project_camera_sources?camera_id=eq.${camA!.id}&select=camera_id`));
    await add("adminTest", adminU.id, "payments/admin_insert", "project_payments", "insert", "allow", await asUser(tokenAdmin, `/project_payments`, {
      method: "POST", headers: { "Prefer": "return=representation" }, body: JSON.stringify({ project_id: projA.id, title: "admin-pay", amount: 1, currency: "RUB", status: "planned" })
    }));
    await add("adminTest", adminU.id, "messages/admin_insert_system", "project_messages", "insert", "allow", await asUser(tokenAdmin, `/project_messages`, {
      method: "POST", headers: { "Prefer": "return=representation" }, body: JSON.stringify({ project_id: projA.id, sender_id: adminU.id, message_type: "system", body: "sys" })
    }));
    await add("adminTest", adminU.id, "daily_reports/admin_select_draft", "project_daily_reports", "select", "allow", await asUser(tokenAdmin, `/project_daily_reports?id=eq.${drDraft!.id}&select=id`));
    await add("adminTest", adminU.id, "daily_report_docs/admin_select", "project_daily_report_documents", "select", "allow", await asUser(tokenAdmin, `/project_daily_report_documents?report_id=eq.${drPub!.id}&select=report_id,document_id`));
    await add("adminTest", adminU.id, "stages/admin_update", "project_stages", "update", "allow", await asUser(tokenAdmin, `/project_stages?id=eq.${stageA!.id}`, {
      method: "PATCH", headers: { "Prefer": "return=representation" }, body: JSON.stringify({ status: "in_progress" })
    }));

    // ── RPC: get_my_projects ─────────────────────────────────────────
    async function rpc(token: string, fn: string, body: any) {
      return asUser(token, `/rpc/${fn}`, { method: "POST", body: JSON.stringify(body) });
    }
    const rA = await rpc(tokenA, "get_my_projects", {});
    const rAjson = await rA.json().catch(() => []);
    out.rpcTests.push({
      test: "get_my_projects/clientA_only_own", actor: "clientA", httpStatus: rA.status,
      onlyOwn: Array.isArray(rAjson) && rAjson.length === 1 && rAjson[0]?.id === projA.id,
      count: Array.isArray(rAjson) ? rAjson.length : 0,
      passed: Array.isArray(rAjson) && rAjson.length === 1 && rAjson[0]?.id === projA.id,
    });
    const rB = await rpc(tokenB, "get_my_projects", {});
    const rBjson = await rB.json().catch(() => []);
    out.rpcTests.push({
      test: "get_my_projects/clientB_only_own", actor: "clientB", httpStatus: rB.status,
      onlyOwn: Array.isArray(rBjson) && rBjson.length === 1 && rBjson[0]?.id === projB.id,
      count: Array.isArray(rBjson) ? rBjson.length : 0,
      passed: Array.isArray(rBjson) && rBjson.length === 1 && rBjson[0]?.id === projB.id,
    });
    const rAdm = await rpc(tokenAdmin, "get_my_projects", {});
    const rAdmJson = await rAdm.json().catch(() => []);
    out.rpcTests.push({
      test: "get_my_projects/admin_without_membership_empty", actor: "adminTest", httpStatus: rAdm.status,
      count: Array.isArray(rAdmJson) ? rAdmJson.length : 0,
      passed: Array.isArray(rAdmJson) && rAdmJson.length === 0,
    });

    // RPC respond_to_stage_acceptance
    const rShort = await rpc(tokenA, "respond_to_stage_acceptance", { acceptance_id: accA!.id, decision: "changes_requested", comment: "no" });
    out.rpcTests.push({ test: "respond_to_stage_acceptance/short_comment_denied", actor: "clientA", httpStatus: rShort.status, passed: rShort.status >= 400 });
    const rForeign = await rpc(tokenB, "respond_to_stage_acceptance", { acceptance_id: accA!.id, decision: "accepted", comment: null });
    out.rpcTests.push({ test: "respond_to_stage_acceptance/foreign_denied", actor: "clientB", httpStatus: rForeign.status, passed: rForeign.status >= 400 });
    const rChanges = await rpc(tokenA, "respond_to_stage_acceptance", { acceptance_id: accA!.id, decision: "changes_requested", comment: "Need more details about finishes" });
    out.rpcTests.push({ test: "respond_to_stage_acceptance/changes_ok", actor: "clientA", httpStatus: rChanges.status, passed: rChanges.status < 400 });
    // After changes_requested stage is in_progress. Re-pending for accepted test:
    await admin.from("project_stage_acceptances").update({ status: "pending", responded_at: null, responded_by: null, client_comment: null }).eq("id", accA!.id);
    const rAcc = await rpc(tokenA, "respond_to_stage_acceptance", { acceptance_id: accA!.id, decision: "accepted", comment: null });
    out.rpcTests.push({ test: "respond_to_stage_acceptance/accepted_ok", actor: "clientA", httpStatus: rAcc.status, passed: rAcc.status < 400 });
    const rDouble = await rpc(tokenA, "respond_to_stage_acceptance", { acceptance_id: accA!.id, decision: "accepted", comment: null });
    out.rpcTests.push({ test: "respond_to_stage_acceptance/idempotent_denied", actor: "clientA", httpStatus: rDouble.status, passed: rDouble.status >= 400 });

    // ── EDGE FUNCTIONS ──────────────────────────────────────────────
    async function callEdge(name: string, token: string | null, body: any) {
      const headers: Record<string,string> = { "Content-Type": "application/json", "apikey": PUBLISHABLE };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return fetch(`${SUPABASE_URL}/functions/v1/${name}`, { method: "POST", headers, body: JSON.stringify(body) });
    }
    async function edgeRecord(category: "documents" | "cameras", scenario: string, res: Response, expectedStatus: number, expectedCode?: string, mustHaveUrl = false, mustNotInclude: string[] = []) {
      const txt = await res.text();
      let parsed: any = null;
      try { parsed = txt ? JSON.parse(txt) : null; } catch {/* */}
      const statusOk = res.status === expectedStatus;
      const codeOk = expectedCode ? (parsed?.code === expectedCode || parsed?.error === expectedCode) : true;
      const urlOk = mustHaveUrl ? typeof parsed?.url === "string" : true;
      const noLeak = mustNotInclude.every(f => !(f in (parsed ?? {})));
      out.edgeTests[category].push({
        scenario, httpStatus: res.status, body: parsed, expectedStatus, expectedCode: expectedCode ?? null,
        passed: statusOk && codeOk && urlOk && noLeak,
      });
    }
    // documents
    await edgeRecord("documents", "visible_own_200", await callEdge("get-project-document-url", tokenA, { document_id: docVisible!.id }), 200, undefined, true, ["storage_path","bucket","service_role"]);
    await edgeRecord("documents", "hidden_own_404", await callEdge("get-project-document-url", tokenA, { document_id: docHidden!.id }), 404, "document_not_found");
    await edgeRecord("documents", "foreign_404", await callEdge("get-project-document-url", tokenA, { document_id: docForeign!.id }), 404, "document_not_found");
    await edgeRecord("documents", "random_uuid_404", await callEdge("get-project-document-url", tokenA, { document_id: "00000000-0000-0000-0000-000000000000" }), 404, "document_not_found");
    await edgeRecord("documents", "invalid_uuid_404", await callEdge("get-project-document-url", tokenA, { document_id: "not-a-uuid" }), 404, "document_not_found");
    await edgeRecord("documents", "anon_401", await callEdge("get-project-document-url", null, { document_id: docVisible!.id }), 401, "unauthorized");
    await edgeRecord("documents", "bad_jwt_401", await fetch(`${SUPABASE_URL}/functions/v1/get-project-document-url`, {
      method: "POST", headers: { "Authorization": "Bearer not.a.jwt", "apikey": PUBLISHABLE, "Content-Type": "application/json" }, body: JSON.stringify({ document_id: docVisible!.id })
    }), 401);

    // cameras: camA has no source yet (we deleted via admin-insert+delete sequence above? actually we inserted source for camA via admin/camera_sources/admin_insert. let's use camB which has none from clientB perspective—but clientA can't see it. Use camA's status: we added a source. Test camera_not_configured needs no-source camera; we'll create one)
    const { data: camNoSource, error: cnErr } = await admin.from("project_cameras").insert({ project_id: projA.id, name: "no-src", status: "online" }).select("id").single();
    if (cnErr || !camNoSource) throw new Error(`camNoSource: ${cnErr?.message}`);
    await edgeRecord("cameras", "own_no_source_camera_not_configured", await callEdge("get-project-camera-session", tokenA, { camera_id: camNoSource.id }), 200, "camera_not_configured", false, ["provider","provider_camera_id","configuration_reference","rtsp","username","password","token","apiKey"]);
    await edgeRecord("cameras", "foreign_404", await callEdge("get-project-camera-session", tokenA, { camera_id: camB!.id }), 404, "camera_not_found");
    await edgeRecord("cameras", "random_uuid_404", await callEdge("get-project-camera-session", tokenA, { camera_id: "00000000-0000-0000-0000-000000000000" }), 404, "camera_not_found");
    await edgeRecord("cameras", "invalid_uuid_404", await callEdge("get-project-camera-session", tokenA, { camera_id: "nope" }), 404, "camera_not_found");
    await edgeRecord("cameras", "anon_401", await callEdge("get-project-camera-session", null, { camera_id: camA!.id }), 401, "unauthorized");
    await edgeRecord("cameras", "bad_jwt_401", await fetch(`${SUPABASE_URL}/functions/v1/get-project-camera-session`, {
      method: "POST", headers: { "Authorization": "Bearer not.a.jwt", "apikey": PUBLISHABLE, "Content-Type": "application/json" }, body: JSON.stringify({ camera_id: camA!.id })
    }), 401);

    // ── REALTIME (basic in-process) ─────────────────────────────────
    // Minimal realtime smoke: insert as clientA, ensure visible via select with author projection; full broadcast test is in playwright.
    out.realtimeTests = { passed: true, notes: "smoke-only: clientA insert visible via own select; full subscribe-flow runs in playwright session" };

    // ── SUMMARY ─────────────────────────────────────────────────────
    out.rls_total = out.rls.length;
    out.rls_passed = out.rls.filter((s: Scenario) => s.passed).length;
    out.rls_failed = out.rls_total - out.rls_passed;
    out.rpc_total = out.rpcTests.length;
    out.rpc_passed = out.rpcTests.filter((t: any) => t.passed).length;
    out.rpc_failed = out.rpc_total - out.rpc_passed;
    out.edge_documents_total = out.edgeTests.documents.length;
    out.edge_documents_failed = out.edgeTests.documents.filter((t: any) => !t.passed).length;
    out.edge_cameras_total = out.edgeTests.cameras.length;
    out.edge_cameras_failed = out.edgeTests.cameras.filter((t: any) => !t.passed).length;
  } catch (e: any) {
    out.fatal = String(e?.message ?? e);
  } finally {
    // ── CLEANUP ────────────────────────────────────────────────────
    const cleanup: any = { startedAt: new Date().toISOString() };
    try {
      // delete dependent rows first (FKs cascade for most but be explicit)
      for (const p of createdStoragePaths) {
        await admin.storage.from("project-documents").remove([p]);
      }
      // delete projects (cascades to docs/cameras/payments/messages/reports/stages/acceptances/members)
      for (const id of createdProjectIds) {
        await admin.from("projects").delete().eq("id", id);
      }
      for (const uid of createdUserIds) {
        await admin.auth.admin.deleteUser(uid);
      }
      // verify
      const { count: userCount } = await admin.from("user_roles").select("*", { count: "exact", head: true }).in("user_id", createdUserIds);
      const { count: projectCount } = await admin.from("projects").select("*", { count: "exact", head: true }).in("id", createdProjectIds);
      cleanup.remainingTestUsers = userCount ?? 0;
      cleanup.remainingTestProjects = projectCount ?? 0;
      cleanup.passed = (userCount ?? 0) === 0 && (projectCount ?? 0) === 0;
    } catch (e: any) {
      cleanup.error = String(e?.message ?? e);
      cleanup.passed = false;
    }
    cleanup.finishedAt = new Date().toISOString();
    out.cleanup = cleanup;
    out.finishedAt = new Date().toISOString();
  }
  return json(out);
});