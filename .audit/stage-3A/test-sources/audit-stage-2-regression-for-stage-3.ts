/**
 * Регрессионный аудит этапа 2 после намеренной активации backend этапа 3.
 * В отличие от исторического audit:stage-2-final он РАЗРЕШАЕТ:
 *   - /login активирован (RouteStub снят);
 *   - EstimateForm обращается к Edge Function submit-estimate-request;
 *   - formы остаются в DEMO-режиме при выключенном PUBLIC_DATA_COLLECTION_ENABLED;
 * но всё ещё ЗАПРЕЩАЕТ ослабление контента этапа 2.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { SERVICE_PAGES } from "@/data/service-pages";
import { PRICES } from "@/data/prices";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const has = (p: string) => existsSync(resolve(root, p));

const errors: string[] = [];
function expect(name: string, cond: boolean, detail = "") {
  if (!cond) errors.push(`${name}${detail ? ": " + detail : ""}`);
}

const totals = {
  priceItems: PRICES.length,
  servicePages: SERVICE_PAGES.length,
  repairServicePages: SERVICE_PAGES.filter((p) => p.category === "repair" && !p.isStub).length,
  constructionServicePages: SERVICE_PAGES.filter((p) => p.category === "construction" && !p.isStub).length,
  engineeringServicePages: SERVICE_PAGES.filter((p) => p.category === "engineering" && !p.isStub).length,
};

expect("priceItems=334", totals.priceItems === 334, String(totals.priceItems));
expect("servicePages=35", totals.servicePages === 35, String(totals.servicePages));
expect("repairServicePages=11", totals.repairServicePages === 11, String(totals.repairServicePages));
expect("constructionServicePages=18", totals.constructionServicePages === 18, String(totals.constructionServicePages));
expect("engineeringServicePages=6", totals.engineeringServicePages === 6, String(totals.engineeringServicePages));

// Калькулятор и 4 режима
const calc = read("src/data/calculator-specification.ts");
expect("calculator: 4 mode keys", (calc.match(/mode:\s*"(repair|construction|engineering|tile)"/g) ?? []).length >= 4);
expect("calculator route", has("src/routes/kalkulyator-stoimosti.tsx"));

// /login разрешено быть активированным
const loginSrc = read("src/routes/login.tsx");
expect("login: noindex сохранён", /noindex/.test(loginSrc));

// EstimateForm — разрешён только вызов утверждённой Edge Function
const formSrc = read("src/components/forms/EstimateForm.tsx");
expect("EstimateForm: localStorage draft сохранён", /STORAGE_KEY/.test(formSrc) && /localStorage/.test(formSrc));
expect("EstimateForm: вызов только submit-estimate-request", /submit-estimate-request/.test(formSrc));
expect("EstimateForm: нет прямого insert в estimate_requests",
  !/from\(['"]estimate_requests['"]\)[\s\S]{0,200}\.insert/.test(formSrc));
expect("EstimateForm: feature-flag gate", /isPublicDataCollectionEnabled/.test(formSrc));

// Юридические страницы остались
for (const p of ["src/routes/privacy.tsx", "src/routes/personal-data-consent.tsx", "src/routes/terms.tsx", "src/routes/cookies.tsx", "src/routes/requisites.tsx"]) {
  expect(`legal page ${p}`, has(p));
}

// Информационные страницы этапа 2.6
for (const p of ["src/routes/about.tsx","src/routes/contacts.tsx","src/routes/portfolio.tsx","src/routes/reviews.tsx","src/routes/faq.tsx","src/routes/team.tsx","src/routes/how-we-work.tsx","src/routes/kontrol-kachestva.tsx","src/routes/sro-i-dokumenty.tsx"]) {
  expect(`info page ${p}`, has(p));
}

// Ни один inline-сервис не дублирует ukladka-plitki
const pagesIndex = read("src/data/service-pages.ts");
const tileMentions = (pagesIndex.match(/slug:\s*"ukladka-plitki"/g) ?? []).length;
expect("ukladka-plitki: единственное определение", tileMentions <= 1, `inline=${tileMentions}`);

// Маршруты этапа 4/5 остаются заглушками
const clientStub = read("src/routes/client.tsx");
const adminStub = read("src/routes/admin.tsx");
expect("/client: RouteStub", /RouteStub/.test(clientStub));
expect("/admin: RouteStub", /RouteStub/.test(adminStub));

const result = {
  stage: "stage-2-regression-for-stage-3",
  totals,
  errors,
  passed: errors.length === 0,
};
console.log(JSON.stringify(result, null, 2));
if (errors.length > 0) {
  console.error(`stage-2-regression-for-stage-3: ${errors.length} ошибок`);
  process.exit(1);
}
process.exit(0);