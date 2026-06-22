/**
 * Машинные RLS-тесты: реально создаём тестовых пользователей через
 * Auth Admin API, авторизуемся (password grant) для получения JWT,
 * выполняем запросы к Data API от имени anon / clientA / clientB / admin
 * и фиксируем фактические результаты. В конце удаляем тестовые данные.
 *
 * Использует SUPABASE_SERVICE_ROLE_KEY только серверно (не во frontend).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const URL_ = process.env.SUPABASE_URL!;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
if (!URL_ || !SR || !ANON) { console.error("env: SUPABASE_URL/SERVICE_ROLE/PUBLISHABLE обязательны"); process.exit(1); }

const admin = createClient(URL_, SR, { auth: { persistSession: false } });

type Result = { testName: string; actor: string; operation: string; resource: string; expected: "allow"|"deny"; actual: "allow"|"deny"|"error"; passed: boolean; errorCode?: string };
const results: Result[] = [];

async function exec(testName: string, actor: string, op: string, resource: string, expected: "allow"|"deny", fn: () => Promise<{ error: any | null; data?: unknown }>) {
  try {
    const { error } = await fn();
    const isDeny = !!error;
    const actual: "allow"|"deny" = isDeny ? "deny" : "allow";
    const passed = actual === expected;
    results.push({ testName, actor, operation: op, resource, expected, actual, passed, errorCode: error?.code });
    console.log(`  ${passed ? "✓" : "✗"} [${actor}] ${op} ${resource} → ${actual} (expected ${expected})${error?.code ? ` code=${error.code}` : ""}`);
  } catch (e) {
    results.push({ testName, actor, operation: op, resource, expected, actual: "error", passed: false, errorCode: (e as Error).message });
    console.log(`  ✗ [${actor}] ${op} ${resource} → ERROR ${(e as Error).message}`);
  }
}

function clientWithToken(token: string | null): SupabaseClient {
  return createClient(URL_, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
  });
}

async function createUser(email: string, password: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(`createUser ${email}: ${error?.message}`);
  return data.user.id;
}
async function signIn(email: string, password: string): Promise<string> {
  const anonClient = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { data, error } = await anonClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`signIn ${email}: ${error?.message}`);
  return data.session.access_token;
}
async function deleteUser(id: string) { await admin.auth.admin.deleteUser(id).catch(() => {}); }

const stamp = Date.now();
const emailA = `test-clientA-${stamp}@stage3.local`;
const emailB = `test-clientB-${stamp}@stage3.local`;
const emailAdmin = `test-admin-${stamp}@stage3.local`;
const pwd = "Stage3-TestPwd-" + stamp;

let uidA = "", uidB = "", uidAdmin = "";
let projectId = "", reqIdA = "", reqIdB = "", stageId = "";

async function setup() {
  console.log("== setup ==");
  uidA = await createUser(emailA, pwd);
  uidB = await createUser(emailB, pwd);
  uidAdmin = await createUser(emailAdmin, pwd);

  // handle_new_user триггер уже создал profile + role=client
  // Назначаем admin
  const { error: roleErr } = await admin.from("user_roles").upsert({ user_id: uidAdmin, role: "admin" }, { onConflict: "user_id,role" });
  if (roleErr) throw new Error("assign admin: " + roleErr.message);

  // Тестовый проект для clientA
  const proj = await admin.from("projects").insert({ title: "stage3-test-project", status: "active" }).select("id").single();
  if (proj.error) throw new Error("create project: " + proj.error.message);
  projectId = proj.data.id;
  const mem = await admin.from("project_members").insert({ project_id: projectId, user_id: uidA, member_role: "client" });
  if (mem.error) throw new Error("add member: " + mem.error.message);
  const st = await admin.from("project_stages").insert({ project_id: projectId, sort_order: 1, title: "stage", status: "planned" }).select("id").single();
  if (st.error) throw new Error("create stage: " + st.error.message);
  stageId = st.data.id;

  // Тестовые заявки (вставка через service role — обход RLS)
  const rA = await admin.from("estimate_requests").insert({
    request_number: `TEST-A-${stamp}`, submission_id: crypto.randomUUID(), user_id: uidA,
    source_path: "/test", contact_name: "A", email: emailA, consent_version: "test", consent_accepted_at: new Date().toISOString(), status: "new",
  }).select("id").single();
  if (rA.error) throw new Error("req A: " + rA.error.message);
  reqIdA = rA.data.id;
  const rB = await admin.from("estimate_requests").insert({
    request_number: `TEST-B-${stamp}`, submission_id: crypto.randomUUID(), user_id: uidB,
    source_path: "/test", contact_name: "B", email: emailB, consent_version: "test", consent_accepted_at: new Date().toISOString(), status: "new",
  }).select("id").single();
  if (rB.error) throw new Error("req B: " + rB.error.message);
  reqIdB = rB.data.id;
  console.log(`  setup ok: A=${uidA.slice(0,8)} B=${uidB.slice(0,8)} admin=${uidAdmin.slice(0,8)} project=${projectId.slice(0,8)}`);
}

async function teardown() {
  console.log("== teardown ==");
  await admin.from("consent_records").delete().in("request_id", [reqIdA, reqIdB].filter(Boolean));
  await admin.from("estimate_requests").delete().in("id", [reqIdA, reqIdB].filter(Boolean));
  await admin.from("project_members").delete().eq("project_id", projectId);
  await admin.from("project_stages").delete().eq("project_id", projectId);
  await admin.from("project_documents").delete().eq("project_id", projectId);
  await admin.from("projects").delete().eq("id", projectId);
  await admin.from("user_roles").delete().in("user_id", [uidA, uidB, uidAdmin].filter(Boolean));
  await admin.from("profiles").delete().in("id", [uidA, uidB, uidAdmin].filter(Boolean));
  for (const u of [uidA, uidB, uidAdmin]) if (u) await deleteUser(u);
}

async function runMatrix() {
  const anon = clientWithToken(null);
  const tokenA = await signIn(emailA, pwd);
  const tokenB = await signIn(emailB, pwd);
  const tokenAdmin = await signIn(emailAdmin, pwd);
  const cA = clientWithToken(tokenA);
  const cB = clientWithToken(tokenB);
  const cAdmin = clientWithToken(tokenAdmin);

  // ---- Anon ----
  console.log("== anonymous ==");
  await exec("anon-profiles-select","anon","select","profiles","deny", async () => {
    const r = await anon.from("profiles").select("id").limit(1);
    return { error: (r.error || (r.data?.length === 0 ? { code: "rls-empty" } : null)), data: r.data };
  });
  await exec("anon-user_roles-select","anon","select","user_roles","deny", async () => {
    const r = await anon.from("user_roles").select("user_id").limit(1);
    return { error: r.error || (r.data?.length === 0 ? { code: "rls-empty" } : null) };
  });
  await exec("anon-estimate-select","anon","select","estimate_requests","deny", async () => {
    const r = await anon.from("estimate_requests").select("id").limit(1);
    return { error: r.error || (r.data?.length === 0 ? { code: "rls-empty" } : null) };
  });
  await exec("anon-estimate-insert","anon","insert","estimate_requests","deny", async () => {
    const r = await anon.from("estimate_requests").insert({ request_number: "X", submission_id: crypto.randomUUID(), source_path: "/x", contact_name: "X", consent_version: "x", consent_accepted_at: new Date().toISOString() });
    return { error: r.error };
  });
  await exec("anon-projects-select","anon","select","projects","deny", async () => {
    const r = await anon.from("projects").select("id").limit(1);
    return { error: r.error || (r.data?.length === 0 ? { code: "rls-empty" } : null) };
  });
  await exec("anon-documents-select","anon","select","project_documents","deny", async () => {
    const r = await anon.from("project_documents").select("id").limit(1);
    return { error: r.error || (r.data?.length === 0 ? { code: "rls-empty" } : null) };
  });
  await exec("anon-storage-list","anon","list","storage:project-documents","deny", async () => {
    const r = await anon.storage.from("project-documents").list();
    return { error: r.error || ((r.data?.length ?? 0) === 0 ? { code: "rls-empty" } : null) };
  });

  // ---- Client A ----
  console.log("== clientA ==");
  await exec("clientA-own-profile-select","clientA","select","profiles(self)","allow", async () => {
    const r = await cA.from("profiles").select("id").eq("id", uidA).single();
    return { error: r.error };
  });
  await exec("clientA-other-profile-select","clientA","select","profiles(other)","deny", async () => {
    const r = await cA.from("profiles").select("id").eq("id", uidB);
    return { error: r.error || ((r.data?.length ?? 0) === 0 ? { code: "rls-empty" } : null) };
  });
  await exec("clientA-own-roles-select","clientA","select","user_roles(self)","allow", async () => {
    const r = await cA.from("user_roles").select("role").eq("user_id", uidA);
    return { error: r.error || ((r.data?.length ?? 0) === 0 ? { code: "rls-empty" } : null) };
  });
  await exec("clientA-admin-insert-self","clientA","insert","user_roles(admin)","deny", async () => {
    const r = await cA.from("user_roles").insert({ user_id: uidA, role: "admin" });
    return { error: r.error };
  });
  await exec("clientA-own-request-select","clientA","select","estimate_requests(self)","allow", async () => {
    const r = await cA.from("estimate_requests").select("id").eq("id", reqIdA).single();
    return { error: r.error };
  });
  await exec("clientA-other-request-select","clientA","select","estimate_requests(other)","deny", async () => {
    const r = await cA.from("estimate_requests").select("id").eq("id", reqIdB);
    return { error: r.error || ((r.data?.length ?? 0) === 0 ? { code: "rls-empty" } : null) };
  });
  await exec("clientA-own-project-select","clientA","select","projects(member)","allow", async () => {
    const r = await cA.from("projects").select("id").eq("id", projectId).single();
    return { error: r.error };
  });
  await exec("clientA-member-insert","clientA","insert","project_members","deny", async () => {
    const r = await cA.from("project_members").insert({ project_id: projectId, user_id: uidB, member_role: "client" });
    return { error: r.error };
  });
  await exec("clientA-stage-update","clientA","update","project_stages","deny", async () => {
    const r = await cA.from("project_stages").update({ status: "completed" }).eq("id", stageId).select("id");
    if (r.error) return { error: r.error };
    return { error: (r.data?.length ?? 0) === 0 ? { code: "rls-empty" } : null };
  });
  await exec("clientA-document-insert","clientA","insert","project_documents","deny", async () => {
    const r = await cA.from("project_documents").insert({ project_id: projectId, storage_path: "x", file_name: "x" });
    return { error: r.error };
  });

  // ---- Client B ----
  console.log("== clientB ==");
  await exec("clientB-project-select","clientB","select","projects(non-member)","deny", async () => {
    const r = await cB.from("projects").select("id").eq("id", projectId);
    return { error: r.error || ((r.data?.length ?? 0) === 0 ? { code: "rls-empty" } : null) };
  });

  // ---- Admin ----
  console.log("== admin ==");
  await exec("admin-profiles-select","admin","select","profiles","allow", async () => {
    const r = await cAdmin.from("profiles").select("id").limit(10);
    return { error: r.error };
  });
  await exec("admin-requests-select","admin","select","estimate_requests","allow", async () => {
    const r = await cAdmin.from("estimate_requests").select("id").limit(10);
    return { error: r.error };
  });
  await exec("admin-request-update","admin","update","estimate_requests","allow", async () => {
    const r = await cAdmin.from("estimate_requests").update({ status: "in_review" }).eq("id", reqIdA);
    return { error: r.error };
  });
  await exec("admin-projects-select","admin","select","projects","allow", async () => {
    const r = await cAdmin.from("projects").select("id").limit(10);
    return { error: r.error };
  });
  await exec("admin-member-insert","admin","insert","project_members","allow", async () => {
    const r = await cAdmin.from("project_members").insert({ project_id: projectId, user_id: uidB, member_role: "manager" });
    return { error: r.error };
  });
}

const out = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", ".audit/stage-3A/rls-test-matrix.json");

try {
  await setup();
  await runMatrix();
} catch (e) {
  console.error("FATAL:", (e as Error).message);
  results.push({ testName: "fatal", actor: "harness", operation: "setup", resource: "n/a", expected: "allow", actual: "error", passed: false, errorCode: (e as Error).message });
} finally {
  await teardown();
}

const passed = results.filter(r => r.passed).length;
const failed = results.length - passed;
writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), passed, failed, total: results.length, results }, null, 2));
console.log(`\nrls-tests: ${passed}/${results.length} прошли; matrix → ${out}`);
if (failed > 0) process.exit(1);
process.exit(0);