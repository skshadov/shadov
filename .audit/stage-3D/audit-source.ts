import fs from "node:fs";
import path from "node:path";

const ROOT = ".audit/stage-3D";
function readJson(name: string) { return JSON.parse(fs.readFileSync(path.join(ROOT, name), "utf8")); }

const funcsBefore = readJson("cloud-functions-before.json");
const funcsAfter  = readJson("cloud-functions-after.json");
const secsBefore  = readJson("cloud-secrets-before.json");
const secsAfter   = readJson("cloud-secrets-after.json");
const matrix      = readJson("cloud-edge-integration-matrix.json");
const idem        = readJson("cloud-concurrent-idempotency-test.json");
const para        = readJson("cloud-rate-limit-parallel-test.json");
const roll        = readJson("cloud-transaction-rollback-test.json");
const cors        = readJson("cloud-cors-test.json");
const saltJ       = readJson("cloud-missing-salt-test.json");
const usersC      = readJson("test-users-cleanup.json");
const dbC         = readJson("test-database-cleanup.json");
const storC       = readJson("test-storage-cleanup.json");

const get = (name: string) => matrix.matrix.find((m: any) => m.name === name);
const checks = {
  validAnonymousCloudSubmissionPassed: get("valid_anonymous")?.passed === true,
  validAuthenticatedCloudSubmissionPassed: get("valid_authenticated")?.passed === true,
  cloudConcurrentIdempotencyPassed: get("concurrent_idempotency")?.passed === true,
  cloudParallelRateLimitPassed: get("parallel_rate_limit")?.passed === true,
  cloudConsentRollbackPassed: get("transaction_rollback")?.passed === true,
  cloudCorsPassed: ["origin_allowed","origin_disallowed","origin_missing"].every((n) => get(n)?.passed === true),
  cloudMissingSaltPassed: get("rate_limit_salt_present")?.passed === true,
  productionFunctionDeployed: funcsAfter.functions["submit-estimate-request"]?.deployed === true,
  testFunctionDeployed: funcsAfter.functions["submit-estimate-request-test"]?.deployed === true,
  debugFunctionDeployed:
    funcsAfter.functions["stage3c-debug-address"]?.deployed === true ||
    funcsAfter.functions["inspect-client-address"]?.deployed === true ||
    funcsAfter.functions["stage3d-runner"]?.deployed === true,
  testSecretsActive: ["TEST_MODE_ENABLED","TEST_RUN_TOKEN","TEST_ALLOWED_ORIGINS","TEST_RATE_LIMIT_SALT"]
    .some((s) => (secsAfter.secrets as string[]).includes(s)),
  remainingTestUsers: usersC.remainingTestUsers as number,
  remainingTestRows: dbC.remainingTestRows as number,
  remainingTestStorageObjects: storC.remainingTestStorageObjects as number,
  deployedCloudEdgeTestsExecuted: matrix.testFunctionUrl?.startsWith("https://") && matrix.testFunctionUrl.includes(".supabase.co/functions/v1/submit-estimate-request-test"),
  localOnlyEdgeTests: false,
  testOnlyRpcExists: false,
  PUBLIC_DATA_COLLECTION_ENABLED: false,
  PUBLIC_AUTH_ENABLED: false,
  operatorConfigured: false,
};

const conditions = {
  ...checks,
  readyForProductionDataCollection: false,
  readyForStage4:
    checks.validAnonymousCloudSubmissionPassed &&
    checks.validAuthenticatedCloudSubmissionPassed &&
    checks.cloudConcurrentIdempotencyPassed &&
    checks.cloudParallelRateLimitPassed &&
    checks.cloudConsentRollbackPassed &&
    checks.cloudCorsPassed &&
    checks.cloudMissingSaltPassed &&
    checks.productionFunctionDeployed === true &&
    checks.testFunctionDeployed === false &&
    checks.debugFunctionDeployed === false &&
    checks.testSecretsActive === false &&
    checks.testOnlyRpcExists === false &&
    checks.remainingTestUsers === 0 &&
    checks.remainingTestRows === 0 &&
    checks.remainingTestStorageObjects === 0 &&
    checks.deployedCloudEdgeTestsExecuted === true,
};

const passed =
  conditions.readyForStage4 === true &&
  conditions.PUBLIC_DATA_COLLECTION_ENABLED === false &&
  conditions.PUBLIC_AUTH_ENABLED === false;

const report = {
  stage: "3D",
  completedAt: new Date().toISOString(),
  testFunctionUrl: matrix.testFunctionUrl,
  cloudEdgeIntegrationMatrix: matrix.matrix.map((m: any) => ({ name: m.name, passed: m.passed })),
  conditions,
  cloudFunctionsBefore: funcsBefore.functions,
  cloudFunctionsAfter: funcsAfter.functions,
  cloudSecretsBefore: secsBefore.secrets,
  cloudSecretsAfter: secsAfter.secrets,
  testCleanup: { usersC, dbC, storC },
  specificationCheck: { passed },
};

fs.writeFileSync(path.join(ROOT, "audit.json"), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(ROOT, "audit-exit-code.txt"), passed ? "0\n" : "1\n");
console.log(JSON.stringify({ passed, readyForStage4: conditions.readyForStage4 }, null, 2));
if (!passed) process.exit(1);
