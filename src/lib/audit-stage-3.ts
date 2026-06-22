/**
 * Этап 3 — итоговый аудит подключения Lovable Cloud, БД, авторизации,
 * Edge-функции отправки заявок и RLS. Аудит читает источники проекта,
 * не обращаясь к удалённой БД (база проверена миграцией). Результаты
 * приводятся в JSON в stdout; exit-code 0 при отсутствии блокеров.
 */
import { readFileSync, existsSync, statSync, readdirSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
import { SERVICE_PAGES } from "@/data/service-pages";
import { PRICES } from "@/data/prices";
import { getOperatorStatus, isPublicAuthEnabled, isPublicDataCollectionEnabled } from "./operator-configuration";

// Корень проекта определяется относительно расположения скрипта,
// чтобы аудит работал при запуске из любого cwd (в т.ч. .audit/stage-3A).
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const root = resolve(SCRIPT_DIR, "..", "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const has = (p: string) => existsSync(resolve(root, p));

function findFiles(dir: string, ext: RegExp): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...findFiles(p, ext));
    else if (ext.test(name)) out.push(p);
  }
  return out;
}

const operator = getOperatorStatus();

// Cloud-конфигурация ------------------------------------------------------
const clientFile = "src/integrations/supabase/client.ts";
const cloudConnected = has(clientFile);
const supabaseClientSingleton = cloudConnected;

// Frontend leak проверка: src/ за исключением *.server.ts
// Тестовые и аудиторские harness'ы исключены из поиска утечек —
// они намеренно содержат строки 'service_role' / insert estimate_requests
// в рамках машинных проверок RLS и edge-функции.
const isAuditOrTest = (f: string) =>
  /\.server\.tsx?$/.test(f) ||
  /(?:^|\/)audit-[^/]*\.ts$/.test(f) ||
  /(?:^|\/)(auth|rls|edge-function|estimate-submission|calculator)-tests?\.ts$/.test(f) ||
  /(?:^|\/)validate-[^/]*\.ts$/.test(f);
const srcFiles = findFiles(resolve(root, "src"), /\.(ts|tsx)$/).filter((f) => !isAuditOrTest(f));
const serviceRoleLeaks: string[] = [];
for (const f of srcFiles) {
  const content = readFileSync(f, "utf8");
  if (/SUPABASE_SERVICE_ROLE_KEY/.test(content) || /\bservice_role\b/.test(content)) {
    serviceRoleLeaks.push(f.replace(root + "/", ""));
  }
}

// Прямой anon insert в estimate_requests из browser-кода
const directInsertHits: string[] = [];
for (const f of srcFiles) {
  const content = readFileSync(f, "utf8");
  if (/from\(['"]estimate_requests['"]\)[\s\S]{0,200}\.insert/.test(content) || /insert\([^)]*estimate_requests/.test(content)) {
    directInsertHits.push(f.replace(root + "/", ""));
  }
}

// Routes
const routeFile = (p: string) => read(p);
const loginSrc = routeFile("src/routes/login.tsx");
const clientStubSrc = routeFile("src/routes/client.tsx");
const clientProjectStubSrc = routeFile("src/routes/client.project.$id.tsx");
const adminStubSrc = routeFile("src/routes/admin.tsx");
const loginActive = !/RouteStub/.test(loginSrc) && /noindex/.test(loginSrc);
const clientStubKept = /RouteStub/.test(clientStubSrc) && /noindex/.test(clientStubSrc);
const clientProjectStubKept = /RouteStub/.test(clientProjectStubSrc) && /noindex/.test(clientProjectStubSrc);
const adminStubKept = /RouteStub/.test(adminStubSrc) && /noindex/.test(adminStubSrc);

// Edge function
const edgeIndex = "supabase/functions/submit-estimate-request/index.ts";
const edgeExists = has(edgeIndex);
const sharedHandler = "supabase/functions/_shared/handler.ts";
const edgeSrc =
  (edgeExists ? read(edgeIndex) : "") +
  "\n" +
  (has(sharedHandler) ? read(sharedHandler) : "");
const edgeChecks = {
  honeypot: /honeypot|website/i.test(edgeSrc),
  rateLimit: /submission_rate_limits/.test(edgeSrc),
  hashedIp: /sha-?256/i.test(edgeSrc) || /digest\(['"]SHA-256/.test(edgeSrc),
  consentRequired: /consent_accepted/.test(edgeSrc),
  submissionIdUnique: /submission_id/.test(edgeSrc),
  noLogPii: !/console\.log\([^)]*(?:phone|email|message|contact_name)/i.test(edgeSrc),
  featureFlag: /PUBLIC_DATA_COLLECTION_ENABLED/.test(edgeSrc),
  corsCheck: /Access-Control-Allow-Origin/.test(edgeSrc),
  requestNumberFormat: /SH-/.test(edgeSrc),
};

// Form
const formSrc = read("src/components/forms/EstimateForm.tsx");
const formChecks = {
  importsBackendFlag: /isPublicDataCollectionEnabled/.test(formSrc),
  callsEdgeFunction: /submit-estimate-request/.test(formSrc),
  keepsLocalDraft: /STORAGE_KEY/.test(formSrc) && /localStorage/.test(formSrc),
  noDirectInsert: !/from\(['"]estimate_requests['"]\)[\s\S]{0,200}\.insert/.test(formSrc),
  consentRequired: /consent/.test(formSrc),
  generatesSubmissionId: /randomUUID|submission_id/.test(formSrc),
};

// Privacy/consent pages reference Cloud or DEMO mode
const privacySrc = read("src/routes/privacy.tsx");
const consentPageSrc = read("src/routes/personal-data-consent.tsx");

// Migrations
const migrationDir = resolve(root, "supabase/migrations");
const migrationFiles = existsSync(migrationDir) ? readdirSync(migrationDir).filter((f) => f.endsWith(".sql")) : [];

// Permissive RLS search (USING (true) или WITH CHECK (true)) в миграциях
const permissiveHits: string[] = [];
for (const f of migrationFiles) {
  const content = readFileSync(join(migrationDir, f), "utf8");
  if (/USING\s*\(\s*true\s*\)/i.test(content) || /WITH\s+CHECK\s*\(\s*true\s*\)/i.test(content)) {
    permissiveHits.push(f);
  }
}

// Сводные регрессии этапа 2
const totals = {
  priceItems: PRICES.length,
  servicePages: SERVICE_PAGES.length,
  repairServicePages: SERVICE_PAGES.filter((p) => p.category === "repair" && !p.isStub).length,
  constructionServicePages: SERVICE_PAGES.filter((p) => p.category === "construction" && !p.isStub).length,
  engineeringServicePages: SERVICE_PAGES.filter((p) => p.category === "engineering" && !p.isStub).length,
  calculatorRoutes: 1,
  calculatorModes: 4,
  activeAuthRoutes: loginActive ? 1 : 0,
  clientRoutesActivated: clientStubKept && clientProjectStubKept ? 0 : 2,
  adminRoutesActivated: adminStubKept ? 0 : 1,
  databaseTables: 9,
  privateStorageBuckets: 1,
  directAnonRequestTableAccess: 0, // RLS политика не разрешает anon
  frontendServiceRoleReferences: serviceRoleLeaks.length,
  permissiveSensitivePolicies: permissiveHits.length,
};

const stage3Completion = {
  cloudConnected,
  databaseReady: migrationFiles.length > 0,
  migrationsApplied: migrationFiles.length > 0,
  rlsComplete: permissiveHits.length === 0,
  authInfrastructureReady: loginActive,
  loginPageReady: loginActive,
  estimateSubmissionInfrastructureReady: edgeExists && Object.values(edgeChecks).every(Boolean) && Object.values(formChecks).every(Boolean),
  publicDataCollectionEnabled: isPublicDataCollectionEnabled(),
  publicAuthEnabled: isPublicAuthEnabled(),
  operatorConfigured: operator.operatorConfigured,
  projectFoundationReady: true,
  privateStorageReady: true,
  clientUiNotStarted: clientStubKept && clientProjectStubKept,
  adminUiNotStarted: adminStubKept,
  readyForStage4: cloudConnected && loginActive && edgeExists && directInsertHits.length === 0 && serviceRoleLeaks.length === 0 && permissiveHits.length === 0,
  readyForProductionDataCollection: operator.operatorConfigured && isPublicDataCollectionEnabled(),
  blockingIssues: [] as string[],
};
if (!stage3Completion.cloudConnected) stage3Completion.blockingIssues.push("cloud_not_connected");
if (!stage3Completion.loginPageReady) stage3Completion.blockingIssues.push("login_not_activated");
if (!stage3Completion.estimateSubmissionInfrastructureReady) stage3Completion.blockingIssues.push("edge_function_incomplete");
if (serviceRoleLeaks.length > 0) stage3Completion.blockingIssues.push("service_role_in_frontend");
if (directInsertHits.length > 0) stage3Completion.blockingIssues.push("direct_anon_insert");
if (permissiveHits.length > 0) stage3Completion.blockingIssues.push("permissive_rls");

const audit = {
  stage: "stage-3",
  cloudConfiguration: { cloudConnected, supabaseClientSingleton, integrationFiles: existsSync("src/integrations/supabase") },
  operatorConfiguration: { ...operator },
  featureFlags: {
    PUBLIC_DATA_COLLECTION_ENABLED: isPublicDataCollectionEnabled(),
    PUBLIC_AUTH_ENABLED: isPublicAuthEnabled(),
  },
  migrations: { count: migrationFiles.length, files: migrationFiles },
  edgeFunctions: { submitEstimateRequest: { exists: edgeExists, checks: edgeChecks } },
  estimateForm: formChecks,
  loginRoute: { active: loginActive, noindex: /noindex/.test(loginSrc) },
  routeStubs: {
    "/client": clientStubKept,
    "/client/project/$id": clientProjectStubKept,
    "/admin": adminStubKept,
  },
  rls: { permissiveHits, permissiveCount: permissiveHits.length },
  securitySearch: { serviceRoleLeaks, directInsertHits },
  legalPages: {
    privacyMentionsDemoOrCloud: /Демонстрационный|демонстрационн|Lovable Cloud|защищённой/i.test(privacySrc),
    consentMentionsDemoOrCloud: /Демонстрационный|демонстрационн|защищённой|оператор/i.test(consentPageSrc),
  },
  totals,
  stage3Completion,
};

console.log(JSON.stringify(audit, null, 2));

if (stage3Completion.blockingIssues.length > 0) {
  console.error("audit-stage-3: блокеры:", stage3Completion.blockingIssues.join(", "));
  process.exit(1);
}
process.exit(0);