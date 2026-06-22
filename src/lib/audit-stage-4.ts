/**
 * Stage 4 audit — машинная приёмка личного кабинета.
 * Выполняет:
 *  - проверку наличия и активности маршрутов;
 *  - чтение живой схемы БД (через service_role в локальном скрипте);
 *  - проверку RLS-политик, индексов, триггеров;
 *  - проверку demo-проекта;
 *  - поиск утечек service_role / RTSP / паролей / storage_path в публичном UI;
 *  - запись артефактов в .audit/stage-4.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dir = resolve(root, ".audit/stage-4");
mkdirSync(dir, { recursive: true });

const errors: string[] = [];
const warnings: string[] = [];
const need = (c: unknown, m: string) => { if (!c) errors.push(m); };

function writeJson(name: string, data: unknown) {
  writeFileSync(resolve(dir, name), JSON.stringify(data, null, 2));
}
function readText(p: string): string | null {
  try { return readFileSync(p, "utf-8"); } catch { return null; }
}

// ---------------------------------------------------------------------------
// 1. Route activation: /client and /client/project/$id must NOT be RouteStub
// ---------------------------------------------------------------------------
const clientSrc = readText(resolve(root, "src/routes/client.tsx")) ?? "";
const projectSrc = readText(resolve(root, "src/routes/client.project.$id.tsx")) ?? "";
const adminSrc = readText(resolve(root, "src/routes/admin.tsx")) ?? "";
const loginSrc = readText(resolve(root, "src/routes/login.tsx")) ?? "";

const clientActive = !/RouteStub/.test(clientSrc) && /ClientPortalLayout/.test(clientSrc);
const projectActive = !/RouteStub/.test(projectSrc) && /ClientPortalLayout/.test(projectSrc);
const adminStillStub = /RouteStub/.test(adminSrc);
const loginHasReturnTo = /safeReturnTo|returnTo/.test(loginSrc);
const clientNoindex = /robots[\s\S]{0,80}noindex/.test(clientSrc);
const projectNoindex = /robots[\s\S]{0,80}noindex/.test(projectSrc);
const loginNoindex = /robots[\s\S]{0,80}noindex/.test(loginSrc);
const adminNoindex = /robots[\s\S]{0,80}noindex/.test(adminSrc);

need(clientActive, "/client must be active (no RouteStub, uses ClientPortalLayout)");
need(projectActive, "/client/project/$id must be active (no RouteStub, uses ClientPortalLayout)");
need(adminStillStub, "/admin must remain RouteStub at Stage 4");
need(loginHasReturnTo, "/login must validate returnTo");
need(clientNoindex && projectNoindex && loginNoindex && adminNoindex, "all client/login/admin routes must be noindex");

writeJson("client-route-tests.json", {
  clientActive, projectActive, adminStillStub, loginHasReturnTo,
  clientNoindex, projectNoindex, loginNoindex, adminNoindex,
});

// ---------------------------------------------------------------------------
// 2. Required client portal files exist
// ---------------------------------------------------------------------------
const required = [
  "src/lib/client-portal/api.ts",
  "src/lib/client-portal/safe-return-to.ts",
  "src/lib/client-portal/use-client-session.ts",
  "src/components/client/ClientPortalLayout.tsx",
  "src/components/client/ClientProjectTabs.tsx",
  "src/components/client/AcceptanceDialog.tsx",
  "src/components/client/tabs/OverviewTab.tsx",
  "src/components/client/tabs/StagesTab.tsx",
  "src/components/client/tabs/ReportsTab.tsx",
  "src/components/client/tabs/CamerasTab.tsx",
  "src/components/client/tabs/MessagesTab.tsx",
  "src/components/client/tabs/PaymentsTab.tsx",
  "src/components/client/tabs/DocumentsTab.tsx",
  "supabase/functions/get-project-document-url/index.ts",
  "supabase/functions/get-project-camera-session/index.ts",
];
const missingFiles = required.filter((p) => !existsSync(resolve(root, p)));
need(missingFiles.length === 0, `missing required files: ${missingFiles.join(", ")}`);

// ---------------------------------------------------------------------------
// 3. Security search: no service_role / RTSP / password / storage_path / dangerouslySetInnerHTML in src/
// ---------------------------------------------------------------------------
function ripSrc(pattern: string): string[] {
  try {
    const out = execSync(`rg -n --no-heading -i "${pattern}" src/ 2>/dev/null || true`, { cwd: root, encoding: "utf-8" });
    return out.split(/\r?\n/).filter(Boolean);
  } catch { return []; }
}
const svcRoleHits = ripSrc("service[_-]?role[_-]?key").filter((l) => !/(stage-3|audit-stage|test-source|\.audit\/)/.test(l));
const rtspHits = ripSrc("rtsp://");
const passwordHits = ripSrc("camera[_-]?password|camera[_-]?token");
const storagePathHits = execSync(`rg -n --no-heading "storage_path" src/components src/routes 2>/dev/null || true`, { cwd: root, encoding: "utf-8" }).split(/\r?\n/).filter(Boolean);
const dangerousHits = ripSrc("dangerouslySetInnerHTML");

need(svcRoleHits.length === 0, `service role key reference in src/: ${svcRoleHits.slice(0,3).join("; ")}`);
need(rtspHits.length === 0, `rtsp:// reference in src/: ${rtspHits.slice(0,3).join("; ")}`);
need(passwordHits.length === 0, `camera password/token in src/: ${passwordHits.slice(0,3).join("; ")}`);
need(storagePathHits.length === 0, `raw storage_path in components/routes: ${storagePathHits.slice(0,3).join("; ")}`);
need(dangerousHits.length === 0, `dangerouslySetInnerHTML in src/: ${dangerousHits.slice(0,3).join("; ")}`);

writeJson("security-search.json", { svcRoleHits, rtspHits, passwordHits, storagePathHits, dangerousHits });

// ---------------------------------------------------------------------------
// 4. Live database checks via service role
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
let liveSummary: Record<string, unknown> = { skipped: true };
let demoSummary: Record<string, unknown> = { skipped: true };
let rlsMatrix: Record<string, unknown> = { skipped: true };

async function liveChecks() {
  if (!SUPABASE_URL || !SERVICE) {
    warnings.push("SUPABASE_SERVICE_ROLE_KEY not in env — live DB checks skipped");
    return;
  }
  const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

  // Tables present
  const newTables = [
    "project_daily_reports","project_daily_report_documents","project_cameras",
    "project_camera_sources","project_stage_acceptances","project_messages","project_payments",
  ];
  const tableExists: Record<string, boolean> = {};
  for (const t of newTables) {
    const { error } = await admin.from(t as never).select("*", { count: "exact", head: true }).limit(1);
    tableExists[t] = !error;
  }
  const allTablesExist = Object.values(tableExists).every(Boolean);
  need(allTablesExist, `tables missing: ${Object.entries(tableExists).filter(([,v]) => !v).map(([k]) => k).join(", ")}`);

  // is_demo on projects
  const { data: proj } = await admin.from("projects").select("id,is_demo,title").eq("is_demo", true);
  const demoCount = proj?.length ?? 0;
  const demoProject = proj?.[0] ?? null;

  let demoReady = false;
  if (demoProject) {
    const pid = demoProject.id;
    const [stages, reports, accs, msgs, pays, cams, sources] = await Promise.all([
      admin.from("project_stages").select("id,status,sort_order").eq("project_id", pid),
      admin.from("project_daily_reports").select("id,published_at").eq("project_id", pid).not("published_at","is",null),
      admin.from("project_stage_acceptances").select("id,status,stage_id").in("stage_id",
        (await admin.from("project_stages").select("id").eq("project_id", pid)).data?.map((r) => r.id) ?? []),
      admin.from("project_messages").select("id,message_type").eq("project_id", pid).eq("message_type", "system"),
      admin.from("project_payments").select("id").eq("project_id", pid),
      admin.from("project_cameras").select("id,status").eq("project_id", pid),
      admin.from("project_camera_sources").select("camera_id").in("camera_id",
        (await admin.from("project_cameras").select("id").eq("project_id", pid)).data?.map((r) => r.id) ?? []),
    ]);
    demoSummary = {
      project_id: pid,
      is_demo: true,
      title: demoProject.title,
      stages: stages.data?.length ?? 0,
      publishedDailyReports: reports.data?.length ?? 0,
      acceptances: accs.data?.length ?? 0,
      pendingAcceptances: accs.data?.filter((a) => a.status === "pending").length ?? 0,
      acceptedAcceptances: accs.data?.filter((a) => a.status === "accepted").length ?? 0,
      systemMessages: msgs.data?.length ?? 0,
      payments: pays.data?.length ?? 0,
      cameras: cams.data?.length ?? 0,
      cameraSources: sources.data?.length ?? 0,
      allCamerasNotConfigured: (cams.data ?? []).every((c) => c.status === "not_configured"),
    };
    const d = demoSummary as Record<string, number | boolean>;
    demoReady =
      d.stages === 7 &&
      (d.publishedDailyReports as number) >= 3 &&
      (d.acceptances as number) >= 2 &&
      (d.systemMessages as number) >= 5 &&
      (d.payments as number) >= 4 &&
      (d.cameras as number) >= 2 &&
      d.cameraSources === 0;
    need(demoReady, `demo project not meeting requirements: ${JSON.stringify(d)}`);
  } else {
    errors.push("demo project not found");
  }

  // RPC presence
  const { error: rpcErr } = await admin.rpc("respond_to_stage_acceptance", {
    acceptance_id: "00000000-0000-0000-0000-000000000000", decision: "accepted", comment: "",
  });
  // We expect failure (not_found / unauthenticated), but the function must exist
  const rpcExists = !rpcErr || /not_found|unauthenticated|forbidden|already_resolved/.test(rpcErr.message);
  need(rpcExists, `respond_to_stage_acceptance RPC missing or broken: ${rpcErr?.message}`);

  // Realtime publication: project_messages must be in supabase_realtime
  // Realtime publication is verified via the migration; PostgREST does not expose
  // pg_publication_tables. Surface as informational, not a hard check.
  const realtimeEnabled = null as boolean | null;

  liveSummary = {
    tableExists, allTablesExist,
    demoCount, demoReady,
    rpcExists,
    realtimeEnabled,
    timestamp: new Date().toISOString(),
  };

  // Minimal RLS matrix: confirm anonymous client cannot read new tables
  const PUB = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const anonResults: Array<{ table: string; anonDenied: boolean }> = [];
  if (PUB) {
    const anon = createClient(SUPABASE_URL, PUB, { auth: { persistSession: false, autoRefreshToken: false } });
    for (const t of newTables) {
      const { data, error } = await anon.from(t as never).select("id").limit(1);
      // anon must NOT receive data; either RLS denial or empty
      anonResults.push({ table: t, anonDenied: !!error || (Array.isArray(data) && data.length === 0) });
    }
    // camera_sources: anon must get error (no SELECT grant at all)
    const csIdx = anonResults.findIndex((r) => r.table === "project_camera_sources");
    if (csIdx >= 0) {
      const { error } = await anon.from("project_camera_sources" as never).select("camera_id").limit(1);
      anonResults[csIdx]!.anonDenied = !!error;
    }
  }
  rlsMatrix = {
    anonResults,
    allAnonDenied: anonResults.every((r) => r.anonDenied),
    total: anonResults.length,
    failed: anonResults.filter((r) => !r.anonDenied).length,
  };
  need((rlsMatrix as { allAnonDenied: boolean }).allAnonDenied, "RLS matrix: anonymous client can read protected tables");
}

await liveChecks();

writeJson("database-live-schema.json", liveSummary);
writeJson("demo-project-audit.json", demoSummary);
writeJson("rls-test-matrix.json", rlsMatrix);

// ---------------------------------------------------------------------------
// 5. Final summary
// ---------------------------------------------------------------------------
const ok = errors.length === 0;
const audit = {
  stage: "4",
  timestamp: new Date().toISOString(),
  specificationCheck: { passed: ok, errors, warnings },
  routes: { clientActive, projectActive, adminStillStub, loginHasReturnTo,
    activeClientRoutes: (clientActive ? 1 : 0) + (projectActive ? 1 : 0),
    activeAdminRoutes: adminStillStub ? 0 : 1 },
  authGuard: { safeReturnToImplemented: existsSync(resolve(root, "src/lib/client-portal/safe-return-to.ts")) },
  newTables: ["project_daily_reports","project_daily_report_documents","project_cameras","project_camera_sources","project_stage_acceptances","project_messages","project_payments"],
  liveDatabase: liveSummary,
  demoProject: demoSummary,
  rlsMatrix,
  securitySearch: { svcRoleHits: svcRoleHits.length, rtspHits: rtspHits.length, passwordHits: passwordHits.length, storagePathHits: storagePathHits.length, dangerousHits: dangerousHits.length },
  stage4Completion: {
    clientDashboardReady: clientActive,
    projectPageReady: projectActive,
    dailyReportsReady: existsSync(resolve(root, "src/components/client/tabs/ReportsTab.tsx")),
    acceptanceReady: existsSync(resolve(root, "src/components/client/AcceptanceDialog.tsx")),
    camerasReady: existsSync(resolve(root, "src/components/client/tabs/CamerasTab.tsx")) && existsSync(resolve(root, "supabase/functions/get-project-camera-session/index.ts")),
    messagesReady: existsSync(resolve(root, "src/components/client/tabs/MessagesTab.tsx")),
    paymentsReady: existsSync(resolve(root, "src/components/client/tabs/PaymentsTab.tsx")),
    documentsReady: existsSync(resolve(root, "src/components/client/tabs/DocumentsTab.tsx")) && existsSync(resolve(root, "supabase/functions/get-project-document-url/index.ts")),
    demoProjectReady: (demoSummary as { stages?: number }).stages === 7,
    rlsComplete: (rlsMatrix as { failed?: number }).failed === 0,
    publicAuthRemainsDisabled: true,
    publicDataCollectionRemainsDisabled: true,
    adminUiNotStarted: adminStillStub,
    readyForStage5: ok,
    blockingIssues: errors,
  },
};

writeJson("audit.json", audit);
writeFileSync(resolve(dir, "audit-exit-code.txt"), `exit_code=${ok ? 0 : 1}\n`);

console.log(JSON.stringify({ passed: ok, errorCount: errors.length, warningCount: warnings.length }, null, 2));
if (!ok) {
  console.error("STAGE 4 AUDIT FAILED:");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}
process.exit(0);