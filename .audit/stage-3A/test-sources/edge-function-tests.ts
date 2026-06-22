/**
 * HTTP-тесты развёрнутой Edge Function submit-estimate-request.
 * Не включает PUBLIC_DATA_COLLECTION_ENABLED, поэтому проверяет только
 * безопасное поведение функции с выключенным флагом: CORS, метод,
 * парсинг JSON, единый шифр ответа disabled. Ветки валидации покрываются
 * estimate-submission-tests.ts (source + дубликат регулярных выражений).
 */
const SUPA_URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!SUPA_URL || !ANON) { console.error("SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY обязательны"); process.exit(1); }
const ENDPOINT = `${SUPA_URL}/functions/v1/submit-estimate-request`;

let passed = 0, failed = 0;
const fails: string[] = [];
async function t(name: string, fn: () => Promise<boolean>) {
  try {
    const ok = await fn();
    if (ok) { passed++; console.log(`  ✓ ${name}`); }
    else { failed++; fails.push(name); console.log(`  ✗ ${name}`); }
  } catch (e) {
    failed++; fails.push(`${name}: ${(e as Error).message}`); console.log(`  ✗ ${name}: ${(e as Error).message}`);
  }
}
const post = (body: unknown, headers: Record<string,string> = {}) =>
  fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", apikey: ANON!, ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });

async function main() {
  await t("OPTIONS preflight → 204", async () => {
    const r = await fetch(ENDPOINT, { method: "OPTIONS", headers: { Origin: "https://shadov.pro", "Access-Control-Request-Method": "POST" } });
    return r.status === 204;
  });
  await t("GET → method_not_allowed (405)", async () => {
    const r = await fetch(ENDPOINT, { method: "GET", headers: { apikey: ANON! } });
    const j = await r.json().catch(() => ({}));
    // disabled-флаг проверяется только после метода-фильтра; реализация возвращает 405 для GET
    return r.status === 405 && j.code === "method_not_allowed";
  });
  await t("POST disabled-flag → 503 public_collection_disabled", async () => {
    const r = await post({});
    const j = await r.json();
    return r.status === 503 && j.code === "public_collection_disabled" && j.success === false;
  });
  await t("Невалидный JSON всё ещё блокируется flag-off (одно и то же сообщение)", async () => {
    const r = await post("{not json");
    const j = await r.json();
    return r.status === 503 && j.code === "public_collection_disabled";
  });
  await t("CORS заголовок присутствует", async () => {
    const r = await post({});
    return r.headers.get("access-control-allow-origin") !== null;
  });
  await t("Тело ответа не содержит внутренний UUID", async () => {
    const r = await post({});
    const text = await r.text();
    return !/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(text);
  });

  console.log(`\nedge-function-tests: ${passed} прошли, ${failed} провалены`);
  console.log("ПРИМЕЧАНИЕ: положительные ветки (успешная отправка, идемпотентность, rate-limit) не выполняются в production-окружении — PUBLIC_DATA_COLLECTION_ENABLED=false по требованиям ТЗ. Валидационные регулярные выражения проверяются машинно в estimate-submission-tests.ts.");
  if (failed > 0) { console.error("FAIL:", fails.join(", ")); process.exit(1); }
  process.exit(0);
}
main();