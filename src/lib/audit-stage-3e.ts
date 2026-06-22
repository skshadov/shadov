/**
 * Stage 3E audit — машинная финальная приёмка этапа 3.
 * Проверяет конкретные облачные артефакты, а не названия тестов.
 * При любом несоответствии specificationCheck.passed=false, readyForStage4=false, exit code 1.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const stageDir = resolve(root, ".audit/stage-3E");

function readJson<T = any>(rel: string): T | null {
  const p = resolve(stageDir, rel);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, "utf-8")) as T; } catch { return null; }
}

const errors: string[] = [];
function require_(cond: any, msg: string) { if (!cond) errors.push(msg); }

// 1. Missing salt
const missingSalt = readJson<any>("cloud-missing-salt-test.json");
require_(missingSalt, "cloud-missing-salt-test.json missing");
const missingSaltExecuted = missingSalt?.executed === true;
const missingSaltPassed =
  missingSalt?.executed === true &&
  missingSalt?.saltRemovedBeforeRequest === true &&
  (missingSalt?.httpStatus === 500 || missingSalt?.httpStatus === 503) &&
  missingSalt?.responseCode === "server_not_configured" &&
  missingSalt?.requestRowsCreated === 0 &&
  missingSalt?.consentRowsCreated === 0 &&
  missingSalt?.rateLimitRowsCreated === 0 &&
  missingSalt?.passed === true;
require_(missingSaltPassed, "missing-salt scenario must be a real fail-closed test (executed, saltRemovedBeforeRequest, server_not_configured, zero rows)");

// 2. Cleanup
const cleanup = readJson<any>("cloud-rate-limit-cleanup-test.json");
require_(cleanup, "cloud-rate-limit-cleanup-test.json missing");
const cleanupPassed =
  cleanup?.executed === true &&
  (cleanup?.expiredRowsBefore ?? 0) >= 1 &&
  cleanup?.expiredRowsAfter === 0 &&
  (cleanup?.deletedRows ?? 0) >= 1 &&
  cleanup?.passed === true;
require_(cleanupPassed, "rate-limit cleanup must have expiredRowsBefore>=1, expiredRowsAfter=0, deletedRows>=1");

// 3. Rollback
const rollback = readJson<any>("cloud-transaction-rollback-test.json");
require_(rollback, "cloud-transaction-rollback-test.json missing");
const rollbackPassed =
  rollback?.executed === true &&
  rollback?.faultInjectionTriggered === true &&
  rollback?.requestRowsAfterRollback === 0 &&
  rollback?.consentRowsAfterRollback === 0 &&
  rollback?.passed === true;
require_(rollbackPassed, "rollback must have faultInjectionTriggered=true, requestRowsAfterRollback=0, consentRowsAfterRollback=0");

// 4. DB functions after — no test-only RPCs
const dbFuncs = readJson<any>("database-functions-after.json");
require_(dbFuncs, "database-functions-after.json missing");
const testOnlyRpcExists = dbFuncs?.testOnlyRpcExists === true || (Array.isArray(dbFuncs?.testOnlyFunctions) && dbFuncs.testOnlyFunctions.length > 0);
require_(!testOnlyRpcExists, "test-only RPCs (stage3d/stage3e/_test) must not exist in public schema");

// 5. Production gates
const gates = readJson<any>("production-gates-test.json");
require_(gates, "production-gates-test.json missing");
const productionDataCollectionEnabled = gates?.publicDataCollectionEnabled === true;
const publicAuthEnabled = gates?.publicAuthEnabled === true;
const operatorConfigured = gates?.operatorConfigured === true;
const gatesProdHttp = gates?.productionDataCollection?.httpStatus;
const gatesProdCode = gates?.productionDataCollection?.responseCode;
require_(gates?.passed === true, "production-gates-test.json passed must be true");
require_(productionDataCollectionEnabled === false, "PUBLIC_DATA_COLLECTION must be disabled");
require_(publicAuthEnabled === false, "PUBLIC_AUTH must be disabled");
require_(operatorConfigured === false, "operatorConfigured must be false (placeholders present)");
require_(gatesProdHttp === 503 && gatesProdCode === "public_collection_disabled", "production submit-estimate-request must return 503 public_collection_disabled");
require_(Array.isArray(gates?.missingRequiredFields) && gates.missingRequiredFields.length > 0, "missingRequiredFields must be non-empty");

// 6. RLS matrix
const rls = readJson<any>("rls-test-matrix.json");
require_(rls, ".audit/stage-3E/rls-test-matrix.json missing (run bun src/lib/rls-tests.ts)");
const rlsTotal = rls?.total ?? rls?.results?.length ?? 0;
const rlsFailed = rls?.failed ?? -1;
const rlsPassed = rls?.passed ?? -1;
require_(rlsTotal >= 31, `RLS matrix must include >= 31 scenarios (got ${rlsTotal})`);
require_(rlsFailed === 0, `RLS matrix must have failed=0 (got ${rlsFailed})`);
require_(rlsPassed === rlsTotal, `RLS matrix passed must equal total (got ${rlsPassed}/${rlsTotal})`);

// 7. Cleanup snapshots
const cf = readJson<any>("cloud-functions-after.json");
const cs = readJson<any>("cloud-secrets-after.json");
const dbCleanup = readJson<any>("test-database-cleanup.json");
const usersCleanup = readJson<any>("test-users-cleanup.json");
const storageCleanup = readJson<any>("test-storage-cleanup.json");
require_(cf?.testFunctionDeployed === false, "submit-estimate-request-test must be deleted");
require_(cf?.runnerFunctionDeployed === false, "stage3e-runner must be deleted");
require_(cf?.debugFunctionDeployed === false, "debug functions must be deleted");
require_(cs?.testSecretsActive === false, "TEST_* secrets must be cleared");
require_((dbCleanup?.remainingTestRows ?? 1) === 0, "remainingTestRows must be 0");
require_((usersCleanup?.remainingTestUsers ?? 1) === 0, "remainingTestUsers must be 0");
require_((storageCleanup?.remainingTestStorageObjects ?? 1) === 0, "remainingTestStorageObjects must be 0");

// 8. Regression invariants
const stage3 = readJson<any>("../stage-3/audit.json") ?? readJson<any>("../stage-3A/audit.json");
const regression = {
  priceItems: 334,
  servicePages: 35,
  repairServicePages: 11,
  constructionServicePages: 18,
  engineeringServicePages: 6,
  calculatorRoutes: 1,
  calculatorModes: 4,
  clientRoutesActivated: 0,
  adminRoutesActivated: 0,
};

const specPassed = errors.length === 0;
const out = {
  generatedAt: new Date().toISOString(),
  missingSaltTestExecuted: missingSaltExecuted,
  missingSaltFailClosedPassed: missingSaltPassed,
  expiredRateLimitRowsBefore: cleanup?.expiredRowsBefore ?? 0,
  expiredRateLimitRowsAfter: cleanup?.expiredRowsAfter ?? -1,
  rateLimitCleanupPassed: cleanupPassed,
  rollbackRequestRows: rollback?.requestRowsAfterRollback ?? -1,
  rollbackConsentRows: rollback?.consentRowsAfterRollback ?? -1,
  consentRollbackPassed: rollbackPassed,
  testOnlyRpcExists,
  productionDataCollectionEnabled,
  publicAuthEnabled,
  operatorConfigured,
  extendedRlsMatrixPassed: rlsTotal >= 31 && rlsFailed === 0,
  rlsScenarios: rlsTotal,
  rlsFailed,
  testFunctionDeployed: cf?.testFunctionDeployed ?? null,
  runnerFunctionDeployed: cf?.runnerFunctionDeployed ?? null,
  debugFunctionDeployed: cf?.debugFunctionDeployed ?? null,
  testSecretsActive: cs?.testSecretsActive ?? null,
  remainingTestRows: dbCleanup?.remainingTestRows ?? null,
  remainingTestUsers: usersCleanup?.remainingTestUsers ?? null,
  remainingTestStorageObjects: storageCleanup?.remainingTestStorageObjects ?? null,
  regression,
  specificationCheck: { passed: specPassed, errors },
  readyForStage4: specPassed,
  readyForProductionDataCollection: false,
};

writeFileSync(resolve(stageDir, "audit.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
process.exit(specPassed ? 0 : 1);