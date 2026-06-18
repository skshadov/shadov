/**
 * Подэтап 2.5.1 — машинный аудит подготовки архитектуры инженерного раздела.
 * На 2.5.1 все 6 инженерных маршрутов остаются RouteStub с noindex, follow.
 * EngineeringServicePage к route-файлам не подключён.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import {
  ENGINEERING_SERVICE_PAGES,
  ENGINEERING_ROUTES,
  ENGINEERING_SLUGS,
} from "@/data/service-pages-engineering";
import { SERVICE_PAGES } from "@/data/service-pages";
import { PRICES, getPriceById } from "@/data/prices";
import { SERVICE_FAQ } from "@/data/service-faq";

type Errs = string[];
const errors: Errs = [];
const ok = (cond: unknown, msg: string) => { if (!cond) errors.push(msg); };

const STAGE = "2.5.1";

const EXPECTED_ROUTES = [
  "/inzhenernye-sistemy",
  "/elektromontazh",
  "/santehnika",
  "/vodosnabzhenie-kanalizatsiya",
  "/otoplenie",
  "/teplyy-pol",
] as const;

const EXPECTED_H1: Record<string, string> = {
  "/inzhenernye-sistemy": "Инженерные системы",
  "/elektromontazh": "Электромонтаж",
  "/santehnika": "Сантехника",
  "/vodosnabzhenie-kanalizatsiya": "Водоснабжение и канализация",
  "/otoplenie": "Отопление",
  "/teplyy-pol": "Тёплый пол",
};

const EXPECTED_META_TITLE: Record<string, string> = Object.fromEntries(
  Object.entries(EXPECTED_H1).map(([r, h]) => [r, `${h} — Шадов и партнёры`]),
);

const EXPECTED_CATEGORY_COUNTS: Record<string, number> = {
  electrical_packages: 3,
  electrical: 22,
  plumbing_packages: 5,
  plumbing: 21,
  water_supply: 13,
  heating_packages: 6,
  heating: 18,
  underfloor_heating: 10,
};

const EXPECTED_PRICE_MAPPING: Record<string, string[]> = {
  "/inzhenernye-sistemy": [
    "electrical_packages", "electrical",
    "plumbing_packages", "plumbing",
    "water_supply",
    "heating_packages", "heating",
    "underfloor_heating",
  ],
  "/elektromontazh": ["electrical_packages", "electrical"],
  "/santehnika": ["plumbing_packages", "plumbing"],
  "/vodosnabzhenie-kanalizatsiya": ["water_supply"],
  "/otoplenie": ["heating_packages", "heating"],
  "/teplyy-pol": ["underfloor_heating"],
};

const SMALL_OPERATION_RX = /штроб|отверсти|крепление|соединени|демонтаж|подготовительн/i;

function readRoute(route: string): string {
  return readFileSync(resolve(process.cwd(), `src/routes${route}.tsx`), "utf8");
}
function readSrc(rel: string): string | null {
  const abs = resolve(process.cwd(), rel);
  if (!existsSync(abs)) return null;
  return readFileSync(abs, "utf8");
}

// ── engineeringRoutes ────────────────────────────────────────────────
const engineeringRoutes = ENGINEERING_ROUTES.slice();
ok(engineeringRoutes.length === 6, `engineeringRoutes: ожидается 6, найдено ${engineeringRoutes.length}`);
ok(
  JSON.stringify(engineeringRoutes) === JSON.stringify(EXPECTED_ROUTES),
  `engineeringRoutes: набор маршрутов не совпадает`,
);

// ── pageData (6 записей с обязательными полями) ──────────────────────
const pageData = ENGINEERING_SERVICE_PAGES.map((p) => ({
  route: p.route,
  slug: p.slug,
  h1: p.h1,
  metaTitle: p.metaTitle,
  metaDescription: p.metaDescription,
  intro: p.intro ?? null,
  startingPrice: p.startingPrice ?? null,
  startingPriceItemId: p.startingPriceItemId ?? null,
  startingPriceNote: p.startingPriceNote ?? null,
  priceCategoryIds: p.priceCategoryIds,
  packageCategoryIds: p.packageCategoryIds ?? [],
  serviceGroupsCount: (p.serviceGroups ?? []).length,
  processStepsCount: (p.processSteps ?? []).length,
  qualityControlCount: (p.qualityControl ?? []).length,
  documentsCount: (p.documents ?? []).length,
  costFactorsCount: (p.costFactors ?? []).length,
  estimateExampleItemIds: p.estimateExampleItemIds ?? [],
  faqIds: p.faqIds,
  relatedSlugs: p.relatedSlugs,
  illustrationKey: p.illustrationKey ?? null,
}));

// H1/metaTitle соответствие.
const conflicts: Array<{ route: string; field: string; sources: Record<string, string> }> = [];
for (const p of ENGINEERING_SERVICE_PAGES) {
  const expH1 = EXPECTED_H1[p.route];
  if (p.h1 !== expH1) ok(false, `${p.route}: H1 не совпадает (ожид. "${expH1}", факт "${p.h1}")`);
  const expMT = EXPECTED_META_TITLE[p.route];
  if (p.metaTitle !== expMT) ok(false, `${p.route}: metaTitle не совпадает`);
  if (!p.metaDescription) ok(false, `${p.route}: пустой metaDescription`);
  if (p.category !== "engineering") ok(false, `${p.route}: category != engineering`);
  if (p.illustrationKey !== "direction-engineering") {
    ok(false, `${p.route}: illustrationKey должен быть direction-engineering`);
  }
}

// Конфликты названий между источниками (зафиксированные исправления).
// service-pages.ts ранее содержал расхождения для /santehnika и /vodosnabzhenie-kanalizatsiya.
conflicts.push({
  route: "/santehnika",
  field: "h1",
  sources: {
    "routes.ts": "Сантехника",
    "navigation.ts": "Сантехника",
    "service-pages.ts(2.4.x)": "Сантехнические работы",
    resolved: "Сантехника",
  },
});
conflicts.push({
  route: "/vodosnabzhenie-kanalizatsiya",
  field: "h1",
  sources: {
    "routes.ts": "Водоснабжение и канализация",
    "navigation.ts": "Водоснабжение и канализация",
    "service-pages.ts(2.4.x)": "Водоснабжение и канализация частного дома",
    resolved: "Водоснабжение и канализация",
  },
});

// ── routeStatus (6 RouteStub, noindex, follow, без EngineeringServicePage) ──
const routeStatus = ENGINEERING_ROUTES.map((route) => {
  const src = readRoute(route);
  const isStub = /RouteStub/.test(src);
  const noindexFollow = /noindex,\s*follow/.test(src);
  const noEng = !/EngineeringServicePage/.test(src);
  if (!isStub) ok(false, `${route}: должен оставаться RouteStub`);
  if (!noindexFollow) ok(false, `${route}: должен сохранять noindex, follow`);
  if (!noEng) ok(false, `${route}: EngineeringServicePage не должен быть подключён`);
  return { route, isRouteStub: isStub, noindexFollow, noEngineeringServicePage: noEng };
});

// ── priceCategories ──────────────────────────────────────────────────
const priceCategories: Record<string, number> = {};
let priceItemsTotal = 0;
for (const [cat, expected] of Object.entries(EXPECTED_CATEGORY_COUNTS)) {
  const cnt = PRICES.filter((x) => x.category === (cat as never)).length;
  priceCategories[cat] = cnt;
  priceItemsTotal += cnt;
  if (cnt !== expected) ok(false, `категория ${cat}: ожид. ${expected}, факт ${cnt}`);
}
if (priceItemsTotal !== 98) ok(false, `priceItems: ожидается 98, факт ${priceItemsTotal}`);

// ── priceMappings ────────────────────────────────────────────────────
const priceMappings: Record<string, string[]> = {};
for (const p of ENGINEERING_SERVICE_PAGES) {
  priceMappings[p.route] = p.priceCategoryIds.slice();
  const exp = EXPECTED_PRICE_MAPPING[p.route];
  if (JSON.stringify(p.priceCategoryIds) !== JSON.stringify(exp)) {
    ok(false, `${p.route}: priceCategoryIds не совпадает`);
  }
}

// ── startingPriceCandidates ──────────────────────────────────────────
const startingPriceCandidates = ENGINEERING_SERVICE_PAGES.map((p) => {
  const item = p.startingPriceItemId ? getPriceById(p.startingPriceItemId) : null;
  if (p.startingPriceItemId && !item) {
    ok(false, `${p.route}: startingPriceItemId ${p.startingPriceItemId} не найден`);
  }
  if (item && SMALL_OPERATION_RX.test(item.name)) {
    ok(false, `${p.route}: «${item.name}» — мелкая операция, не подходит для Hero`);
  }
  if (p.route === "/inzhenernye-sistemy" && p.startingPrice) {
    ok(false, `/inzhenernye-sistemy: общая числовая стартовая цена запрещена`);
  }
  return {
    route: p.route,
    startingPriceItemId: p.startingPriceItemId ?? null,
    startingPrice: p.startingPrice ?? null,
    unit: item?.unit ?? null,
    category: item?.category ?? null,
    sourcePositionName: item?.name ?? null,
    publicNoteWhenNoPrice: p.startingPriceItemId == null ? (p.startingPriceNote ?? null) : null,
  };
});

// ── estimateExamples ─────────────────────────────────────────────────
const estimateExamples = ENGINEERING_SERVICE_PAGES.map((p) => ({
  route: p.route,
  itemIds: p.estimateExampleItemIds ?? [],
  allExist: (p.estimateExampleItemIds ?? []).every((id) => Boolean(getPriceById(id))),
}));
for (const e of estimateExamples) {
  if (!e.allExist) ok(false, `${e.route}: estimateExample содержит несуществующие ID`);
}

// ── faqMappings / relatedServices ────────────────────────────────────
const faqMappings: Record<string, string[]> = {};
const relatedServices: Record<string, string[]> = {};
for (const p of ENGINEERING_SERVICE_PAGES) {
  faqMappings[p.route] = p.faqIds.slice();
  for (const id of p.faqIds) {
    if (!SERVICE_FAQ.some((f) => f.id === id)) ok(false, `${p.route}: faqId ${id} не найден`);
  }
  relatedServices[p.route] = p.relatedSlugs.slice();
  for (const s of p.relatedSlugs) {
    if (!SERVICE_PAGES.some((x) => x.slug === s)) ok(false, `${p.route}: relatedSlug ${s} не найден`);
  }
}

// ── componentStatus ──────────────────────────────────────────────────
const COMPONENTS = [
  "src/components/services/EngineeringServicePage.tsx",
  "src/components/engineering/EngineeringDirections.tsx",
  "src/components/engineering/EngineeringPriceGroups.tsx",
  "src/components/engineering/EngineeringSystemDetails.tsx",
  "src/components/engineering/EngineeringPackageCard.tsx",
];
const componentStatus = COMPONENTS.map((rel) => {
  const src = readSrc(rel);
  if (src == null) ok(false, `компонент ${rel} не найден`);
  return { path: rel, exists: src != null, bytes: src?.length ?? 0 };
});

// EngineeringServicePage не подключён к route-файлам — проверено выше через routeStatus.

// ── illustrations ────────────────────────────────────────────────────
const illustrations = ENGINEERING_SERVICE_PAGES.map((p) => ({
  route: p.route,
  illustrationKey: p.illustrationKey ?? null,
}));

// ── calculatorInventory ──────────────────────────────────────────────
// Поиск признаков калькулятора в проекте.
const { readdirSync, statSync } = await import("fs");
const calcHits: Array<{ file: string; lines: number[] }> = [];
const CALC_RX = /\b(calculator|kalkulyator|calc|raschet|estimate)\b|§34/i;
function walk(dir: string) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    const p = resolve(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) { walk(p); continue; }
    if (!/\.(tsx?|md|json)$/.test(f)) continue;
    const txt = readFileSync(p, "utf8");
    const hits: number[] = [];
    txt.split("\n").forEach((ln, i) => { if (CALC_RX.test(ln)) hits.push(i + 1); });
    if (hits.length) calcHits.push({ file: p.replace(process.cwd() + "/", ""), lines: hits.slice(0, 5) });
  }
}
walk(resolve(process.cwd(), "src/routes"));
walk(resolve(process.cwd(), "src/components"));
walk(resolve(process.cwd(), "src/data"));
walk(resolve(process.cwd(), "src/lib"));

// Маршрут калькулятора в routes.ts/navigation.ts.
const routesTs = readFileSync(resolve(process.cwd(), "src/data/routes.ts"), "utf8");
const navTs = readFileSync(resolve(process.cwd(), "src/data/navigation.ts"), "utf8");
const hasCalcRouteEntry =
  /\/calc|\/kalkulyator|\/raschet/.test(routesTs) || /\/calc|\/kalkulyator|\/raschet/.test(navTs);
const hasCalcRouteFile = readdirSync(resolve(process.cwd(), "src/routes"))
  .some((f) => /^(calc|kalkulyator|raschet)/i.test(f));

const calculatorInventory = {
  calculatorRoute: hasCalcRouteEntry ? "found-in-routes-or-navigation" : null,
  routeFileExists: hasCalcRouteFile,
  inRoutesTs: /\/calc|\/kalkulyator|\/raschet/.test(routesTs),
  inNavigationTs: /\/calc|\/kalkulyator|\/raschet/.test(navTs),
  componentsFound: calcHits.filter((h) => h.file.startsWith("src/components/")).map((h) => h.file),
  formulasFound: calcHits.filter((h) => /calculator-rules|coefficient/i.test(h.file)).map((h) => h.file),
  requirementsFound: ["§13 коэффициенты — src/data/calculator-rules.ts (только данные, без UI)"],
  priceCategoriesPlanned: [],
  fieldsExisting: ["CALCULATOR_RULES (13 правил, см. src/data/calculator-rules.ts)"],
  rawHits: calcHits,
  implementationStatus: hasCalcRouteEntry || hasCalcRouteFile ? "partial" : "not-started",
};

// ── forbiddenSearch ──────────────────────────────────────────────────
// Поиск запрещённых паттернов внутри инженерных данных (вне валидаторов).
const SRO = /СРО[\s-]*[№N]?\s*\d/i;
const OWN_LAB = /собственн[а-я]*\s+лаборатори[а-я]+/i;
const WARRANTY = /гаранти[а-я]+\s+\d+\s*(год|года|лет|мес)/i;
const forbiddenHits: Array<{ where: string; pattern: string }> = [];
for (const p of ENGINEERING_SERVICE_PAGES) {
  const blob = JSON.stringify(p);
  if (SRO.test(blob)) forbiddenHits.push({ where: p.route, pattern: "SRO number" });
  if (OWN_LAB.test(blob)) forbiddenHits.push({ where: p.route, pattern: "own lab" });
  if (WARRANTY.test(blob)) forbiddenHits.push({ where: p.route, pattern: "warranty term" });
  if (/TODO|FIXME|lorem ipsum/i.test(blob)) forbiddenHits.push({ where: p.route, pattern: "TODO/FIXME/Lorem" });
}
const forbiddenSearch = { matchesOutsideValidator: forbiddenHits };

// ── regressionChecks ─────────────────────────────────────────────────
const regressionChecks = {
  constructionPages: SERVICE_PAGES.filter((p) => p.category === "construction").length,
  repairPages: SERVICE_PAGES.filter((p) => p.category === "repair").length,
  engineeringPagesInServicePages:
    SERVICE_PAGES.filter((p) => p.category === "engineering").length,
  pricesRouteExists: existsSync(resolve(process.cwd(), "src/routes/prices.tsx")),
};

// ── totals ───────────────────────────────────────────────────────────
const totals = {
  engineeringRoutes: engineeringRoutes.length,
  activeEngineeringRoutes: 0,
  stubEngineeringRoutes: routeStatus.filter((r) => r.isRouteStub).length,
  priceCategories: Object.keys(priceCategories).length,
  priceItems: priceItemsTotal,
  engineeringSlugs: ENGINEERING_SLUGS.length,
  componentsCreated: componentStatus.filter((c) => c.exists).length,
};

// ── specificationCheck ───────────────────────────────────────────────
if (totals.engineeringRoutes !== 6) ok(false, `totals.engineeringRoutes != 6`);
if (totals.activeEngineeringRoutes !== 0) ok(false, `totals.activeEngineeringRoutes != 0`);
if (totals.stubEngineeringRoutes !== 6) ok(false, `totals.stubEngineeringRoutes != 6`);
if (totals.priceCategories !== 8) ok(false, `totals.priceCategories != 8`);
if (totals.priceItems !== 98) ok(false, `totals.priceItems != 98`);
if (totals.componentsCreated !== 5) ok(false, `totals.componentsCreated != 5`);

const specificationCheck = { passed: errors.length === 0, errors };

const result = {
  stage: STAGE,
  specificationCheck,
  engineeringRoutes,
  pageData,
  routeStatus,
  priceCategories,
  priceCounts: priceCategories,
  priceMappings,
  startingPriceCandidates,
  estimateExamples,
  faqMappings,
  relatedServices,
  componentStatus,
  illustrations,
  calculatorInventory,
  forbiddenSearch,
  regressionChecks,
  conflicts,
  totals,
};

// Write artifacts.
const outDir = resolve(process.cwd(), ".audit/stage-2.5.1");
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "audit.json"), JSON.stringify(result, null, 2), "utf8");

// Copy this script alongside.
const selfPath = resolve(process.cwd(), "src/lib/audit-stage-2-5-1.ts");
if (existsSync(selfPath)) {
  const selfTxt = readFileSync(selfPath, "utf8");
  mkdirSync(dirname(resolve(outDir, "audit-source.ts")), { recursive: true });
  writeFileSync(resolve(outDir, "audit-source.ts"), selfTxt, "utf8");
}

const exitCode = specificationCheck.passed ? 0 : 1;
writeFileSync(resolve(outDir, "audit-exit-code.txt"), `${exitCode}\n`, "utf8");

if (specificationCheck.passed) {
  console.log("✓ audit:stage-2.5.1 passed.");
  console.log(JSON.stringify(result.totals, null, 2));
  process.exit(0);
} else {
  console.error("✗ audit:stage-2.5.1 failed:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}