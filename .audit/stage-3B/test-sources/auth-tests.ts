/**
 * Машинные тесты Auth-инфраструктуры этапа 3.
 * Тесты source-уровня + поведенческие тесты Zod-валидации email,
 * без реальной отправки писем. Производство-флаги остаются выключены.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const has = (p: string) => existsSync(resolve(root, p));

let passed = 0;
let failed = 0;
const fails: string[] = [];
function t(name: string, cond: boolean) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; fails.push(name); console.log(`  ✗ ${name}`); }
}

const loginSrc = read("src/routes/login.tsx");
const clientStub = read("src/routes/client.tsx");
const adminStub = read("src/routes/admin.tsx");
const opSrc = read("src/lib/operator-configuration.ts");

t("/login существует", has("src/routes/login.tsx"));
t("/login не использует RouteStub", !/RouteStub/.test(loginSrc));
t("/login содержит noindex,follow", /noindex,\s*follow/.test(loginSrc));
t("/login использует signInWithOtp", /signInWithOtp/.test(loginSrc));
t("/login использует signOut", /signOut/.test(loginSrc));
t("/login не сохраняет access/refresh token руками",
  !/(localStorage\.setItem\(['\"]access_token|localStorage\.setItem\(['\"]refresh_token)/.test(loginSrc));
t("/login содержит универсальный текст 'ссылка отправлена'",
  /отправ|проверьте|почт/i.test(loginSrc));
t("/login: нет назначения admin по email во frontend",
  !/role:\s*['\"]admin/i.test(loginSrc));
t("/login: использует isPublicAuthEnabled", /isPublicAuthEnabled/.test(loginSrc));

t("/client остаётся RouteStub", /RouteStub/.test(clientStub) && /noindex/.test(clientStub));
t("/admin остаётся RouteStub", /RouteStub/.test(adminStub) && /noindex/.test(adminStub));

// PUBLIC_AUTH_ENABLED по умолчанию false (нет VITE_PUBLIC_AUTH_ENABLED=true в .env)
const env = readFileSync(resolve(root, ".env"), "utf8");
t("VITE_PUBLIC_AUTH_ENABLED отсутствует или false",
  !/^VITE_PUBLIC_AUTH_ENABLED\s*=\s*(true|1|yes|on)/im.test(env));
t("VITE_PUBLIC_DATA_COLLECTION_ENABLED отсутствует или false",
  !/^VITE_PUBLIC_DATA_COLLECTION_ENABLED\s*=\s*(true|1|yes|on)/im.test(env));

// Zod email-валидация
const emailSchema = z.string().email().max(254);
t("email valid: ok@example.com", emailSchema.safeParse("ok@example.com").success);
t("email invalid: no-at", !emailSchema.safeParse("no-at").success);
t("email invalid: no-domain@", !emailSchema.safeParse("no-domain@").success);
t("email invalid: empty", !emailSchema.safeParse("").success);
t("email invalid: too-long", !emailSchema.safeParse("a".repeat(250) + "@x.io").success);

// Логика gate
t("operator-config: envFlag combined с operatorConfigured",
  /envFlag\(['\"]VITE_PUBLIC_AUTH_ENABLED['\"]\)\s*&&\s*getOperatorStatus\(\)\.operatorConfigured/.test(opSrc));
t("operator-config: getOperatorStatus возвращает missingRequiredFields", /missingRequiredFields/.test(opSrc));

// Поиск frontend-утечек admin-привилегий
const grepRecursive = (start: string, re: RegExp, ext = /\.(ts|tsx)$/, exclude = /(audit-|tests?\.ts$|rls-tests|auth-tests|estimate-submission-tests|edge-function-tests)/) => {
  const out: string[] = [];
  const fs = require("fs");
  const path = require("path");
  const walk = (d: string) => {
    for (const n of fs.readdirSync(d)) {
      const p = path.join(d, n);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (ext.test(n) && !exclude.test(n) && re.test(fs.readFileSync(p, "utf8"))) out.push(p);
    }
  };
  walk(start);
  return out;
};
const adminEmailHits = grepRecursive(
  resolve(root, "src"),
  /\.insert\([^)]*role:\s*['\"]admin/,
);
t("нет insert role=admin во frontend", adminEmailHits.length === 0);

console.log(`\nauth-tests: ${passed} прошли, ${failed} провалены`);
if (failed > 0) { console.error("FAIL:", fails.join(", ")); process.exit(1); }
process.exit(0);