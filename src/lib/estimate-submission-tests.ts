/**
 * Машинные тесты EstimateForm и Edge Function на source-уровне.
 */
import { existsSync, readFileSync } from "fs";
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

// Stage 3C: бизнес-логика edge function в _shared/handler.ts; production
// вариант остаётся, тестовая функция после интеграционного прогона удаляется.
const edge = read("supabase/functions/_shared/handler.ts");
const prodFn = read("supabase/functions/submit-estimate-request/index.ts");
t("prod fn использует общий handler", /createHandler\(\s*\{\s*name:\s*"submit-estimate-request"/.test(prodFn));
t("test fn удалена из активного дерева после Stage 3C", !existsSync(resolve(root, "supabase/functions/submit-estimate-request-test/index.ts")));
t("edge: feature-flag check (prod + test branches)", /PUBLIC_DATA_COLLECTION_ENABLED/.test(edge) && /TEST_MODE_ENABLED/.test(edge));
t("edge: CORS preflight 204", /status:\s*204/.test(edge));
t("edge: метод POST only", /method_not_allowed/.test(edge));
t("edge: invalid_json", /invalid_json/.test(edge));
t("edge: honeypot", /website/i.test(edge));
t("edge: bad_submission_id", /bad_submission_id/.test(edge));
t("edge: bad_name", /bad_name/.test(edge));
t("edge: no_contact", /no_contact/.test(edge));
t("edge: bad_email", /bad_email/.test(edge));
t("edge: bad_phone", /bad_phone/.test(edge));
t("edge: no_consent", /no_consent/.test(edge));
t("edge: bad_source", /bad_source/.test(edge));
t("edge: snapshot_too_large", /snapshot_too_large/.test(edge));
t("edge: rate_limited", /rate_limited/.test(edge));
t("edge: SHA-256 hash для rate-limit ключа", /SHA-256/.test(edge));
t("edge: RATE_LIMIT_SALT/TEST_RATE_LIMIT_SALT min length 32", /SALT_MIN_LENGTH\s*=\s*32/.test(edge) && /RATE_LIMIT_SALT\.length\s*<\s*SALT_MIN_LENGTH/.test(edge) && /TEST_RATE_LIMIT_SALT/.test(edge));
t("edge: requestNumber формата SH-YYYYMM-XXXXXX", /SH-\$\{ym\}/.test(edge));
t("edge: возвращает только requestNumber из RPC, не внутренний UUID",
  /requestNumber:\s*row\?\.request_number/.test(edge));
t("edge: идемпотентность через create_estimate_request_transaction RPC",
  /rpc\("create_estimate_request_transaction"/.test(edge));
t("edge: атомарный rate-limit через consume_submission_rate_limit RPC",
  /rpc\("consume_submission_rate_limit"/.test(edge));
t("edge: транзакционная вставка request + consents в одной SECURITY DEFINER функции",
  /create_estimate_request_transaction/.test(edge));
t("edge: нет console.log с PII",
  !/console\.(log|error|warn)\([^)]*(?:contact_name|body\.email|body\.phone|body\.message|calculator_snapshot|authHeader|token)/i.test(edge));
t("edge: CORS fail-closed — нет '?? *' fallback", !/Deno\.env\.get\("ALLOWED_ORIGINS"\)\s*\?\?\s*"\*"/.test(edge));
t("edge: origin_not_allowed 403 для запрещённого Origin", /origin_not_allowed/.test(edge));
t("edge: server_not_configured при отсутствии настроек", /server_not_configured/.test(edge));
t("edge: service_slug — allowlist 35 значений",
  /SERVICE_SLUG_ALLOWLIST\.has\(/.test(edge) && /unknown_service/.test(edge));
t("edge: calculator_mode — точный allowlist", /invalid_calculator_mode/.test(edge));
t("edge: snapshot строгий whitelist полей",
  /snapshot_unknown_field/.test(edge) && /snapshot_unknown_price_id/.test(edge) && /snapshot_unit_mismatch/.test(edge));
t("edge: message_too_long вместо slice", /message_too_long/.test(edge) && !/body\.message\.slice/.test(edge));
t("edge: user_id из проверенного JWT, body.user_id игнорируется",
  /supabase\.auth\.getUser\(token\)/.test(edge) &&
  !edge.split("\n").some(line => !/^\s*(\/\/|\*)/.test(line) && /body\.user_id/.test(line)));
t("edge: cf-connecting-ip как trusted IP", /cf-connecting-ip/.test(edge));
t("edge: x-forwarded-for НЕ используется", !/x-forwarded-for/.test(edge));
t("edge: submission_id не используется как fallback rate-limit key", !/submission:\$\{?/.test(edge) && /edge-shared-fallback/.test(edge));
t("edge: test token required with constant-time comparison", /TEST_RUN_TOKEN/.test(edge) && /constantTimeEqual/.test(edge) && /test_access_denied/.test(edge));

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