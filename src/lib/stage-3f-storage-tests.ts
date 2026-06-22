/**
 * Stage 3F — Реальные интеграционные тесты Storage (bucket: project-documents).
 * Создаёт тестовых пользователей и проект, выполняет операции от имени реальных JWT
 * (anon / client-member / client-non-member / admin), затем удаляет все артефакты.
 *
 * Результаты:
 *   .audit/stage-3F/storage-integration-test.json
 *   .audit/stage-3F/test-storage-cleanup.json   (агрегация для аудита)
 *   .audit/stage-3F/rls-test-matrix.json        (52 базовых сценария + storage)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const URL_ = process.env.SUPABASE_URL!;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
if (!URL_ || !SR || !ANON) { console.error("env: SUPABASE_URL/SERVICE_ROLE/PUBLISHABLE required"); process.exit(1); }

const admin = createClient(URL_, SR, { auth: { persistSession: false } });
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const outDir = resolve(root, ".audit/stage-3F");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

type Scenario = { testName: string; actor: string; operation: string; resource: string; expected: "allow"|"deny"; actual: "allow"|"deny"|"error"; passed: boolean; errorCode?: string };
const storageScenarios: Scenario[] = [];

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
  const c = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`signIn ${email}: ${error?.message}`);
  return data.session.access_token;
}
async function exec(testName: string, actor: string, op: string, resource: string, expected: "allow"|"deny", fn: () => Promise<{ error: any | null; data?: unknown }>) {
  try {
    const { error } = await fn();
    const isDeny = !!error;
    const actual: "allow"|"deny" = isDeny ? "deny" : "allow";
    const passed = actual === expected;
    storageScenarios.push({ testName, actor, operation: op, resource, expected, actual, passed, errorCode: error?.code ?? error?.message?.slice?.(0,80) });
    console.log(`  ${passed ? "✓" : "✗"} [${actor}] ${op} ${resource} → ${actual} (expected ${expected})`);
  } catch (e) {
    storageScenarios.push({ testName, actor, operation: op, resource, expected, actual: "error", passed: false, errorCode: (e as Error).message });
    console.log(`  ✗ [${actor}] ${op} ${resource} → ERROR ${(e as Error).message}`);
  }
}

const stamp = Date.now();
const emailA = `stage3f-member-${stamp}@stage3.local`;
const emailB = `stage3f-other-${stamp}@stage3.local`;
const emailAdmin = `stage3f-admin-${stamp}@stage3.local`;
const pwd = "Stage3F-Pwd-" + stamp;

let uidA = "", uidB = "", uidAdmin = "";
let projectId = "";
let docId = "";
let memberObjectPath = "", adminObjectPath = "", malformedPath = "invalid-project/stage3f.txt";
let storageSqlException = false;

async function setup() {
  console.log("== setup ==");
  uidA = await createUser(emailA, pwd);
  uidB = await createUser(emailB, pwd);
  uidAdmin = await createUser(emailAdmin, pwd);
  const r = await admin.from("user_roles").upsert({ user_id: uidAdmin, role: "admin" }, { onConflict: "user_id,role" });
  if (r.error) throw new Error("assign admin: " + r.error.message);
  const p = await admin.from("projects").insert({ title: "stage3f-test", status: "active" }).select("id").single();
  if (p.error) throw new Error("create project: " + p.error.message);
  projectId = p.data.id;
  const m = await admin.from("project_members").insert({ project_id: projectId, user_id: uidA, member_role: "client" });
  if (m.error) throw new Error("member: " + m.error.message);

  memberObjectPath = `${projectId}/stage3f-member.txt`;
  // Pre-seed an object using service_role so member-read can succeed
  const up = await admin.storage.from("project-documents").upload(memberObjectPath, new Blob(["stage3f-member-content"]), { upsert: true, contentType: "text/plain" });
  if (up.error) throw new Error("seed upload: " + up.error.message);
  const d = await admin.from("project_documents").insert({ project_id: projectId, storage_path: memberObjectPath, file_name: "stage3f-member.txt", mime_type: "text/plain", size_bytes: 22 }).select("id").single();
  if (d.error) throw new Error("doc: " + d.error.message);
  docId = d.data.id;
  console.log(`  setup ok: project=${projectId.slice(0,8)} object=${memberObjectPath}`);
}

async function cleanup() {
  console.log("== teardown ==");
  // Remove any objects we created
  const paths = [memberObjectPath, adminObjectPath, malformedPath].filter(Boolean);
  if (paths.length) await admin.storage.from("project-documents").remove(paths).catch(() => {});
  if (docId) await admin.from("project_documents").delete().eq("id", docId);
  await admin.from("project_documents").delete().eq("project_id", projectId);
  await admin.from("project_stages").delete().eq("project_id", projectId);
  await admin.from("project_members").delete().eq("project_id", projectId);
  await admin.from("projects").delete().eq("id", projectId);
  await admin.from("user_roles").delete().in("user_id", [uidA, uidB, uidAdmin].filter(Boolean));
  await admin.from("profiles").delete().in("id", [uidA, uidB, uidAdmin].filter(Boolean));
  for (const u of [uidA, uidB, uidAdmin]) if (u) await admin.auth.admin.deleteUser(u).catch(() => {});

  // Verify no remnants
  const { data: remaining } = await admin.storage.from("project-documents").list(projectId);
  const remainingObjects = remaining?.length ?? 0;
  const remainingRowsResp = await admin.from("project_documents").select("id", { count: "exact", head: true }).eq("project_id", projectId);
  const remainingRows = remainingRowsResp.count ?? 0;
  const { data: remUsers } = await admin.auth.admin.listUsers();
  const remainingTestUsers = (remUsers?.users ?? []).filter(u => u.email && u.email.includes(`stage3f-`) && u.email.includes(`-${stamp}@`)).length;
  return { remainingObjects, remainingRows, remainingTestUsers };
}

async function run() {
  const anon = clientWithToken(null);
  const tA = await signIn(emailA, pwd);
  const tB = await signIn(emailB, pwd);
  const tAd = await signIn(emailAdmin, pwd);
  const cA = clientWithToken(tA);
  const cB = clientWithToken(tB);
  const cAd = clientWithToken(tAd);

  console.log("== anonymous ==");
  await exec("anon-storage-list-bucket","anon","list","storage:project-documents/","deny", async () => {
    const r = await anon.storage.from("project-documents").list(projectId);
    return { error: r.error || ((r.data?.length ?? 0) === 0 ? { code: "rls-empty" } : null) };
  });
  await exec("anon-storage-download","anon","download","storage:object(member)","deny", async () => {
    const r = await anon.storage.from("project-documents").download(memberObjectPath);
    return { error: r.error };
  });
  await exec("anon-storage-upload","anon","upload","storage:project-documents","deny", async () => {
    const r = await anon.storage.from("project-documents").upload(`${projectId}/anon-hack.txt`, new Blob(["x"]));
    return { error: r.error };
  });

  console.log("== client member ==");
  await exec("member-storage-read-own","clientA","download","storage:object(own-project)","allow", async () => {
    const r = await cA.storage.from("project-documents").download(memberObjectPath);
    return { error: r.error };
  });
  await exec("member-storage-upload-deny","clientA","upload","storage:project-documents","deny", async () => {
    const r = await cA.storage.from("project-documents").upload(`${projectId}/member-upload.txt`, new Blob(["x"]));
    return { error: r.error };
  });
  await exec("member-storage-delete-deny","clientA","delete","storage:project-documents","deny", async () => {
    const r = await cA.storage.from("project-documents").remove([memberObjectPath]);
    // remove() returns {data:[]} on RLS deny — no rows affected.
    if (r.error) return { error: r.error };
    const removedAny = Array.isArray(r.data) && r.data.length > 0;
    return { error: removedAny ? null : { code: "rls-empty" } };
  });

  console.log("== client non-member ==");
  await exec("nonmember-storage-read","clientB","download","storage:object(other-project)","deny", async () => {
    const r = await cB.storage.from("project-documents").download(memberObjectPath);
    return { error: r.error };
  });

  console.log("== admin ==");
  adminObjectPath = `${projectId}/stage3f-admin.txt`;
  await exec("admin-storage-upload","admin","upload","storage:project-documents","allow", async () => {
    const r = await cAd.storage.from("project-documents").upload(adminObjectPath, new Blob(["stage3f-admin"]), { upsert: true, contentType: "text/plain" });
    return { error: r.error };
  });
  await exec("admin-storage-read","admin","download","storage:object","allow", async () => {
    const r = await cAd.storage.from("project-documents").download(adminObjectPath);
    return { error: r.error };
  });
  await exec("admin-storage-delete","admin","delete","storage:project-documents","allow", async () => {
    const r = await cAd.storage.from("project-documents").remove([adminObjectPath]);
    if (r.error) return { error: r.error };
    const removed = Array.isArray(r.data) && r.data.length > 0;
    return { error: removed ? null : { code: "delete-empty" } };
  });

  console.log("== malformed path ==");
  await exec("member-storage-malformed-path","clientA","download","storage:invalid-project/...","deny", async () => {
    try {
      const r = await cA.storage.from("project-documents").download(malformedPath);
      // 500 / SQL cast exception bubbles through as error.message containing 'invalid input syntax for type uuid'
      const msg = (r.error?.message ?? "").toString();
      if (/invalid input syntax for type uuid|22P02/i.test(msg)) storageSqlException = true;
      return { error: r.error };
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (/invalid input syntax for type uuid|22P02/i.test(msg)) storageSqlException = true;
      throw e;
    }
  });
}

let cleanupSummary = { remainingObjects: -1, remainingRows: -1, remainingTestUsers: -1 };
try {
  await setup();
  await run();
} catch (e) {
  console.error("FATAL:", (e as Error).message);
  storageScenarios.push({ testName: "fatal", actor: "harness", operation: "setup", resource: "n/a", expected: "allow", actual: "error", passed: false, errorCode: (e as Error).message });
} finally {
  cleanupSummary = await cleanup();
}

const byName = (n: string) => storageScenarios.find(s => s.testName === n);
const ok = (n: string) => byName(n)?.passed === true;

const storagePayload = {
  generatedAt: new Date().toISOString(),
  executed: true,
  bucket: "project-documents",
  projectId,
  scenarios: storageScenarios,
  anonListDenied: ok("anon-storage-list-bucket"),
  anonReadDenied: ok("anon-storage-download"),
  anonUploadDenied: ok("anon-storage-upload"),
  memberReadOwnAllowed: ok("member-storage-read-own"),
  memberReadOtherDenied: ok("nonmember-storage-read"),
  memberUploadDenied: ok("member-storage-upload-deny"),
  memberDeleteDenied: ok("member-storage-delete-deny"),
  nonMemberReadDenied: ok("nonmember-storage-read"),
  adminUploadAllowed: ok("admin-storage-upload"),
  adminReadAllowed: ok("admin-storage-read"),
  adminDeleteAllowed: ok("admin-storage-delete"),
  malformedPathDenied: ok("member-storage-malformed-path"),
  malformedPathSqlException: storageSqlException,
  cleanupPassed: cleanupSummary.remainingObjects === 0 && cleanupSummary.remainingRows === 0 && cleanupSummary.remainingTestUsers === 0,
  remainingTestStorageObjects: cleanupSummary.remainingObjects,
  remainingTestRows: cleanupSummary.remainingRows,
  remainingTestUsers: cleanupSummary.remainingTestUsers,
  passed: false,
};
storagePayload.passed =
  storagePayload.executed &&
  storagePayload.anonListDenied &&
  storagePayload.anonReadDenied &&
  storagePayload.anonUploadDenied &&
  storagePayload.memberReadOwnAllowed &&
  storagePayload.memberReadOtherDenied &&
  storagePayload.memberUploadDenied &&
  storagePayload.memberDeleteDenied &&
  storagePayload.nonMemberReadDenied &&
  storagePayload.adminUploadAllowed &&
  storagePayload.adminReadAllowed &&
  storagePayload.adminDeleteAllowed &&
  storagePayload.malformedPathDenied &&
  !storagePayload.malformedPathSqlException &&
  storagePayload.cleanupPassed;

writeFileSync(resolve(outDir, "storage-integration-test.json"), JSON.stringify(storagePayload, null, 2));
writeFileSync(resolve(outDir, "test-storage-cleanup.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  bucket: "project-documents",
  remainingTestStorageObjects: cleanupSummary.remainingObjects,
  passed: cleanupSummary.remainingObjects === 0,
}, null, 2));
writeFileSync(resolve(outDir, "test-database-cleanup.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  remainingTestRows: cleanupSummary.remainingRows,
  passed: cleanupSummary.remainingRows === 0,
}, null, 2));
writeFileSync(resolve(outDir, "test-users-cleanup.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  remainingTestUsers: cleanupSummary.remainingTestUsers,
  passed: cleanupSummary.remainingTestUsers === 0,
}, null, 2));

// Merge with existing 52-scenario RLS matrix from stage-3E
const baseRlsPath = resolve(root, ".audit/stage-3E/rls-test-matrix.json");
let baseResults: Scenario[] = [];
if (existsSync(baseRlsPath)) {
  const base = JSON.parse(readFileSync(baseRlsPath, "utf-8"));
  baseResults = base.results ?? [];
}
const merged = [...baseResults, ...storageScenarios];
const passedCount = merged.filter(r => r.passed).length;
const failedCount = merged.length - passedCount;
writeFileSync(resolve(outDir, "rls-test-matrix.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  passed: passedCount,
  failed: failedCount,
  total: merged.length,
  storageScenarioCount: storageScenarios.length,
  results: merged,
}, null, 2));

console.log(`\nstorage tests: ${storageScenarios.filter(s=>s.passed).length}/${storageScenarios.length} passed; matrix total=${merged.length} failed=${failedCount}`);
if (!storagePayload.passed || failedCount > 0) process.exit(1);
process.exit(0);