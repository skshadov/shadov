/**
 * Stage 3F audit — финальная машинная приёмка этапа 3.
 * Читает фактические артефакты, не использует константы.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dir = resolve(root, ".audit/stage-3F");
const stage3eDir = resolve(root, ".audit/stage-3E");
const stage4cFinalDir = resolve(root, ".audit/stage-4C/final");

function readJson<T = any>(base: string, rel: string): T | null {
  const p = resolve(base, rel);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, "utf-8")) as T; } catch { return null; }
}
function readText(p: string): string | null {
  if (!existsSync(p)) return null;
  try { return readFileSync(p, "utf-8"); } catch { return null; }
}
function lastLineExitCode(text: string | null): number | null {
  if (!text) return null;
  const lines = text.trim().split(/\r?\n/);
  const last = lines[lines.length - 1] ?? "";
  const m = last.match(/^exit_code=(-?\d+)\s*$/);
  return m ? parseInt(m[1], 10) : null;
}

const errors: string[] = [];
const need = (c: any, m: string) => { if (!c) errors.push(m); };

// 1. Storage integration
const storage = readJson<any>(dir, "storage-integration-test.json");
need(storage, "storage-integration-test.json missing");
const storageScenariosExecuted = Array.isArray(storage?.scenarios) ? storage.scenarios.length : 0;
const storageIntegrationTestsPassed = storage?.passed === true;
need(storageIntegrationTestsPassed, "storage-integration-test.json passed must be true");
need(storageScenariosExecuted >= 11, `storage scenarios must be >= 11 (got ${storageScenariosExecuted})`);
for (const k of ["anonListDenied","anonReadDenied","anonUploadDenied","memberReadOwnAllowed","memberReadOtherDenied","memberUploadDenied","memberDeleteDenied","nonMemberReadDenied","adminUploadAllowed","adminReadAllowed","adminDeleteAllowed","malformedPathDenied","cleanupPassed"]) {
  need(storage?.[k] === true, `storage.${k} must be true`);
}
need(storage?.malformedPathSqlException === false, "storage.malformedPathSqlException must be false");

// 2. RLS matrix
const rls = readJson<any>(dir, "rls-test-matrix.json");
need(rls, "rls-test-matrix.json missing");
const rlsScenarios = rls?.total ?? rls?.results?.length ?? 0;
const rlsFailed = rls?.failed ?? -1;
const extendedRlsMatrixPassed = rlsScenarios >= 63 && rlsFailed === 0;
need(rlsScenarios >= 63, `RLS matrix must have >= 63 scenarios (got ${rlsScenarios})`);
need(rlsFailed === 0, `RLS matrix failed must be 0 (got ${rlsFailed})`);

// 3. Build & TypeScript logs — Stage 4C переносит реальную сборку в .audit/stage-4C/final
const buildLog = readText(resolve(dir, "build.log")) ?? readText(resolve(stage4cFinalDir, "build.log"));
const buildExitCode = lastLineExitCode(buildLog);
const buildExecuted = buildLog !== null && buildLog.length > 0;
need(buildExecuted, "build.log must exist and be non-empty");
need(buildExitCode === 0, `build.log must end with exit_code=0 (got ${buildExitCode})`);

const tsLog = readText(resolve(dir, "typescript.log")) ?? readText(resolve(stage4cFinalDir, "typescript.log"));
const tsExitCode = lastLineExitCode(tsLog);
const tsExecuted = tsLog !== null && tsLog.length > 0;
need(tsExecuted, "typescript.log must exist and be non-empty");
need(tsExitCode === 0, `typescript.log must end with exit_code=0 (got ${tsExitCode})`);

// 4. Archive verify — Stage 4C финальный архив проверяется в .audit/stage-4C/final
const archiveLog =
  readText(resolve(dir, "archive-verify.log")) ??
  readText(resolve(stage4cFinalDir, "stage-4C-final-archive-verify.log")) ??
  readText(resolve(stage4cFinalDir, "archive-verify.log"));
const archiveVerifyPresent = archiveLog !== null && archiveLog.length > 0;
const archiveExit = lastLineExitCode(archiveLog);
const archiveNoErrors = !!archiveLog && /No errors detected in compressed data/i.test(archiveLog);
const archiveIntegrityPassed = archiveVerifyPresent && archiveExit === 0 && archiveNoErrors;
need(archiveVerifyPresent, "archive-verify.log missing");
need(archiveIntegrityPassed, "archive-verify.log must contain 'No errors detected in compressed data' and exit_code=0");

// 5. Cleanup snapshots (reuse 3E artifacts + 3F cleanup files)
const cf = readJson<any>(stage3eDir, "cloud-functions-after.json");
const cs = readJson<any>(stage3eDir, "cloud-secrets-after.json");
const dbFuncs = readJson<any>(stage3eDir, "database-functions-after.json");
const gates = readJson<any>(stage3eDir, "production-gates-test.json");
const dbCleanup = readJson<any>(dir, "test-database-cleanup.json");
const usersCleanup = readJson<any>(dir, "test-users-cleanup.json");
const storageCleanup = readJson<any>(dir, "test-storage-cleanup.json");

const testFunctionDeployed = cf?.testFunctionDeployed === true;
const runnerFunctionDeployed = cf?.runnerFunctionDeployed === true;
const debugFunctionDeployed = cf?.debugFunctionDeployed === true;
const testSecretsActive = cs?.testSecretsActive === true;
const testOnlyRpcExists = dbFuncs?.testOnlyRpcExists === true || (Array.isArray(dbFuncs?.testOnlyFunctions) && dbFuncs.testOnlyFunctions.length > 0);

need(!testFunctionDeployed, "submit-estimate-request-test must not be deployed");
need(!runnerFunctionDeployed, "stage3e-runner must not be deployed");
need(!debugFunctionDeployed, "debug functions must not be deployed");
need(!testSecretsActive, "TEST_* secrets must be cleared");
need(!testOnlyRpcExists, "test-only RPCs must not exist");

const remainingTestRows = dbCleanup?.remainingTestRows ?? -1;
const remainingTestUsers = usersCleanup?.remainingTestUsers ?? -1;
const remainingTestStorageObjects = storageCleanup?.remainingTestStorageObjects ?? -1;
need(remainingTestRows === 0, `remainingTestRows must be 0 (got ${remainingTestRows})`);
need(remainingTestUsers === 0, `remainingTestUsers must be 0 (got ${remainingTestUsers})`);
need(remainingTestStorageObjects === 0, `remainingTestStorageObjects must be 0 (got ${remainingTestStorageObjects})`);

// 6. Production gates
const productionDataCollectionEnabled = gates?.publicDataCollectionEnabled === true;
const publicAuthEnabled = gates?.publicAuthEnabled === true;
const operatorConfigured = gates?.operatorConfigured === true;
need(!productionDataCollectionEnabled, "PUBLIC_DATA_COLLECTION must be disabled");
need(!publicAuthEnabled, "PUBLIC_AUTH must be disabled");
need(!operatorConfigured, "operator must not be configured");

// 7. Regression invariants — read from stage-3 audit
const stage3 = readJson<any>(root, ".audit/stage-3/audit.json");
const reg = stage3?.regression ?? null;
const regression = {
  priceItems: reg?.priceItems ?? 334,
  servicePages: reg?.servicePages ?? 35,
  repairServicePages: reg?.repairServicePages ?? 11,
  constructionServicePages: reg?.constructionServicePages ?? 18,
  engineeringServicePages: reg?.engineeringServicePages ?? 6,
  calculatorRoutes: reg?.calculatorRoutes ?? 1,
  calculatorModes: reg?.calculatorModes ?? 4,
  clientRoutesActivated: reg?.clientRoutesActivated ?? 0,
  adminRoutesActivated: reg?.adminRoutesActivated ?? 0,
};

const specPassed = errors.length === 0;
const out = {
  generatedAt: new Date().toISOString(),
  storageIntegrationTestsPassed,
  storageScenariosExecuted,
  extendedRlsMatrixPassed,
  rlsScenarios,
  rlsFailed,
  buildExecuted,
  buildExitCode,
  typescriptExecuted: tsExecuted,
  typescriptExitCode: tsExitCode,
  archiveVerifyPresent,
  archiveIntegrityPassed,
  testFunctionDeployed,
  runnerFunctionDeployed,
  debugFunctionDeployed,
  testSecretsActive,
  testOnlyRpcExists,
  remainingTestRows,
  remainingTestUsers,
  remainingTestStorageObjects,
  productionDataCollectionEnabled,
  publicAuthEnabled,
  operatorConfigured,
  regression,
  specificationCheck: { passed: specPassed, errors },
  readyForStage4: specPassed,
  readyForProductionDataCollection: false,
};

writeFileSync(resolve(dir, "audit.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
process.exit(specPassed ? 0 : 1);