/**
 * Машинные тесты EstimateForm и Edge Function на source-уровне.
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

let passed = 0, failed = 0;
const fails: string[] = [];
function t(name: string, cond: boolean) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; fails.push(name); console.log(`  ✗ ${name}`); }
}

const form = read("src/components/forms/EstimateForm.tsx");

t("EstimateForm: вызов supabase.functions.invoke('submit-estimate-request')",
  /supabase\.functions\.invoke\(\s*['\"]submit-estimate-request['\"]/.test(form));
t("EstimateForm: gate isPublicDataCollectionEnabled", /isPublicDataCollectionEnabled\(\)/.test(form));
t("EstimateForm: генерация submission_id через crypto.randomUUID", /crypto\.randomUUID\(\)/.test(form));
t("EstimateForm: passes consent_version", /consent_version/.test(form));
t("EstimateForm: honeypot website-поле", /website/i.test(form));
t("EstimateForm: localStorage draft", /localStorage/.test(form) && /STORAGE_KEY/.test(form));
t("EstimateForm: показ requestNumber после успеха", /requestNumber/.test(form));
t("EstimateForm: без прямого insert в estimate_requests",
  !/from\(['\"]estimate_requests['\"]\)[\s\S]{0,200}\.insert/.test(form));
t("EstimateForm: feature-off ⇒ DEMO mode (localStorage)",
  /isPublicDataCollectionEnabled\(\)/.test(form) && /Демонстрационн|сохранен|сохранены/.test(form));
t("EstimateForm: source_path передаётся", /source_path/.test(form));

// Проверка Edge Function source — все защитные ветки присутствуют
const edge = read("supabase/functions/submit-estimate-request/index.ts");
t("edge: feature-flag check", /PUBLIC_DATA_COLLECTION_ENABLED/.test(edge));
t("edge: CORS preflight 204", /status:\s*204/.test(edge));
t("edge: метод POST only", /method_not_allowed/.test(edge));
t("edge: invalid_json", /invalid_json/.test(edge));
t("edge: honeypot", /honeypot|website/i.test(edge));
t("edge: bad_submission_id", /bad_submission_id/.test(edge));
t("edge: bad_name", /bad_name/.test(edge));
t("edge: no_contact", /no_contact/.test(edge));
t("edge: bad_email", /bad_email/.test(edge));
t("edge: bad_phone", /bad_phone/.test(edge));
t("edge: no_consent", /no_consent/.test(edge));
t("edge: bad_source", /bad_source/.test(edge));
t("edge: snapshot_too_large", /snapshot_too_large/.test(edge));
t("edge: rate_limited", /rate_limited/.test(edge));
t("edge: SHA-256 hash для IP", /SHA-256/.test(edge));
t("edge: RATE_LIMIT_SALT", /RATE_LIMIT_SALT/.test(edge));
t("edge: requestNumber формата SH-YYYYMM-XXXXXX", /SH-\$\{ym\}/.test(edge));
t("edge: возвращает только requestNumber, не внутренний id",
  /requestNumber:\s*(?:inserted\.request_number|generateRequestNumber\(\)|existing\.request_number|again\.request_number)/.test(edge));
t("edge: idempotency по submission_id",
  /submission_id[\s\S]{0,200}maybeSingle/.test(edge));
t("edge: consent_records записываются",
  /from\(['\"]consent_records['\"]\)[\s\S]{0,200}\.insert/.test(edge));
t("edge: нет console.log с PII",
  !/console\.(log|error|warn)\([^)]*(?:contact_name|body\.email|body\.phone|body\.message|calculator_snapshot|authHeader|token)/i.test(edge));

// Поведение validator-функций (дубликат регулярных выражений из edge для assert)
const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && v.length <= 254;
const isPhone = (v: string) => /^(\+7|7|8)?[\s\-()]*\d{3}[\s\-)]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}$/.test(v);
t("validator uuid ok", isUuid("12345678-1234-1234-1234-1234567890ab"));
t("validator uuid bad", !isUuid("not-a-uuid"));
t("validator email ok", isEmail("a@b.io"));
t("validator email bad", !isEmail("nope"));
t("validator phone ok +7", isPhone("+7 (999) 123-45-67"));
t("validator phone bad", !isPhone("abc"));

console.log(`\nestimate-submission-tests: ${passed} прошли, ${failed} провалены`);
if (failed > 0) { console.error("FAIL:", fails.join(", ")); process.exit(1); }
process.exit(0);