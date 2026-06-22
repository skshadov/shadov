/**
 * Подэтап 2.5.2 — машинный аудит подключения и публикации шести
 * инженерных страниц. Подтверждает: ровно 6 инженерных записей в
 * SERVICE_PAGES, активацию маршрутов, корректные H1, стартовые цены,
 * соответствие данных prices.ts, отсутствие заглушек, регрессии.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import {
  ENGINEERING_SERVICE_PAGES,
  ENGINEERING_ROUTES,
  ENGINEERING_SLUGS,
} from "@/data/service-pages-engineering";
import { SERVICE_PAGES } from "@/data/service-pages";
import { PRICES, getPriceById, getPricesByCategory } from "@/data/prices";
import { SERVICE_FAQ } from "@/data/service-faq";
import { resolveServicePage } from "@/lib/get-service-data";

const STAGE = "2.5.2";
const errors: string[] = [];
const ok = (cond: unknown, msg: string) => { if (!cond) errors.push(msg); };

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
  "/teplyy-pол": "Тёплый пол",
};
EXPECTED_H1["/teplyy-pol"] = "Тёплый пол";
delete EXPECTED_H1["/teplyy-pол"];

const EXPECTED_METATITLE: Record<string, string> = Object.fromEntries(
  Object.entries(EXPECTED_H1).map(([r, h]) => [r, `${h} — Шадов и партнёры`]),
);

const EXPECTED_STARTING: Record<string, { hasNumeric: boolean; number?: string; sourceId?: string; note?: string }> = {
  "/inzhenernye-sistemy": { hasNumeric: false, note: "Стоимость рассчитывается по составу работ" },
  "/elektromontazh": { hasNumeric: true, number: "2 500", sourceId: "electrical_packages-basic", note: "По пакету «Электромонтаж — базовый»" },
  "/santehnika": { hasNumeric: true, number: "2 500", sourceId: "plumbing_packages-chastnyy-dom", note: "По пакету «Сантехника частного дома»" },
  "/vodosnabzhenie-kanalizatsiya": { hasNumeric: false, note: "Стоимость рассчитывается по составу работ" },
  "/otoplenie": { hasNumeric: true, number: "1 800", sourceId: "heating_packages-bazovoe", note: "По пакету «Базовое отопление частного дома»" },
  "/teplyy-pol": { hasNumeric: false, note: "Стоимость рассчитывается по составу работ" },
};

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

function readRoute(route: string): string {
  return readFileSync(resolve(process.cwd(), `src/routes${route}.tsx`), "utf8");
}
function normalize(s: string): string { return s.replace(/\u00A0/g, " "); }

// ── engineeringServicePages ──────────────────────────────────────────
const engineeringPages = SERVICE_PAGES.filter((p) => p.category === "engineering");
const engineeringServicePages = engineeringPages.map((p) => ({
  route: p.route,
  slug: p.slug,
  h1: p.h1,
  sourceFile: "src/data/service-pages-engineering.ts",
}));

// ── duplicateCheck ───────────────────────────────────────────────────
const seenRoutes = new Map<string, number>();
const seenSlugs = new Map<string, number>();
for (const p of engineeringPages) {
  seenRoutes.set(p.route, (seenRoutes.get(p.route) ?? 0) + 1);
  seenSlugs.set(p.slug, (seenSlugs.get(p.slug) ?? 0) + 1);
}
const duplicateRoutes = [...seenRoutes.entries()].filter(([, n]) => n > 1).map(([r]) => r);
const duplicateSlugs = [...seenSlugs.entries()].filter(([, n]) => n > 1).map(([s]) => s);
const duplicateCheck = {
  engineeringEntries: engineeringPages.length,
  uniqueRoutes: seenRoutes.size,
  uniqueSlugs: seenSlugs.size,
  duplicateRoutes,
  duplicateSlugs,
};
if (engineeringPages.length !== 6) ok(false, `engineeringServicePages != 6 (${engineeringPages.length})`);
if (seenRoutes.size !== 6) ok(false, `uniqueRoutes != 6`);
if (seenSlugs.size !== 6) ok(false, `uniqueSlugs != 6`);
if (duplicateRoutes.length) ok(false, `дубликаты route: ${duplicateRoutes.join(",")}`);
if (duplicateSlugs.length) ok(false, `дубликаты slug: ${duplicateSlugs.join(",")}`);

// ── routeStatus ──────────────────────────────────────────────────────
const routeStatus = EXPECTED_ROUTES.map((route) => {
  const src = readRoute(route);
  const stub = /RouteStub/.test(src);
  const noindex = /noindex/i.test(src);
  const hasEng = /EngineeringServicePage/.test(src);
  const hasCanonical = /rel:\s*"canonical"/.test(src);
  const hasOg = /og:url/.test(src) && /og:title/.test(src) && /og:description/.test(src);
  const hasBreadcrumb = /BreadcrumbList/.test(src);
  const hasService = /"@type":\s*"Service"/.test(src);
  const hasAsAny = /\bas\s+any\b/.test(src);
  if (stub) ok(false, `${route}: RouteStub не удалён`);
  if (noindex) ok(false, `${route}: noindex не удалён`);
  if (!hasEng) ok(false, `${route}: EngineeringServicePage не подключён`);
  if (!hasCanonical) ok(false, `${route}: canonical отсутствует`);
  if (!hasOg) ok(false, `${route}: Open Graph неполный`);
  if (!hasBreadcrumb) ok(false, `${route}: BreadcrumbList отсутствует`);
  if (!hasService) ok(false, `${route}: Service JSON-LD отсутствует`);
  if (hasAsAny) ok(false, `${route}: as any запрещён`);
  return { route, stub, noindex, hasEng, hasCanonical, hasOg, hasBreadcrumb, hasService, hasAsAny };
});

// ── pageData ─────────────────────────────────────────────────────────
const pageData = engineeringPages.map((p) => ({
  route: p.route,
  slug: p.slug,
  h1: p.h1,
  metaTitle: p.metaTitle,
  metaDescription: p.metaDescription,
  startingPrice: p.startingPrice ?? null,
  startingPriceItemId: p.startingPriceItemId ?? null,
  startingPriceNote: p.startingPriceNote ?? null,
  priceCategoryIds: p.priceCategoryIds,
  packageCategoryIds: p.packageCategoryIds ?? [],
  illustrationKey: p.illustrationKey ?? null,
  processStepsCount: (p.processSteps ?? []).length,
  qualityControlCount: (p.qualityControl ?? []).length,
  documentsCount: (p.documents ?? []).length,
  costFactorsCount: (p.costFactors ?? []).length,
}));
for (const p of engineeringPages) {
  if (p.h1 !== EXPECTED_H1[p.route]) ok(false, `${p.route}: H1 != "${EXPECTED_H1[p.route]}"`);
  if (p.metaTitle !== EXPECTED_METATITLE[p.route]) ok(false, `${p.route}: metaTitle не совпадает`);
  if (!p.metaDescription) ok(false, `${p.route}: пустой metaDescription`);
  if (p.illustrationKey !== "direction-engineering") ok(false, `${p.route}: illustrationKey != direction-engineering`);
  const exp = EXPECTED_PRICE_MAPPING[p.route];
  if (JSON.stringify(p.priceCategoryIds) !== JSON.stringify(exp)) ok(false, `${p.route}: priceCategoryIds не совпадает`);
}

// ── startingPrices ───────────────────────────────────────────────────
const startingPrices = engineeringPages.map((p) => {
  const exp = EXPECTED_STARTING[p.route];
  const item = p.startingPriceItemId ? getPriceById(p.startingPriceItemId) : null;
  if (exp.hasNumeric) {
    if (!p.startingPrice) ok(false, `${p.route}: ожидается startingPrice ${exp.number}`);
    else if (!normalize(p.startingPrice).includes(exp.number!)) ok(false, `${p.route}: startingPrice не содержит ${exp.number}`);
    if (p.startingPriceItemId !== exp.sourceId) ok(false, `${p.route}: startingPriceItemId != ${exp.sourceId}`);
    if (p.startingPriceNote !== exp.note) ok(false, `${p.route}: startingPriceNote != ${exp.note}`);
  } else {
    if (p.startingPrice) ok(false, `${p.route}: числовой Hero-цены быть не должно`);
    if (p.startingPriceNote !== exp.note) ok(false, `${p.route}: startingPriceNote != "${exp.note}"`);
  }
  return {
    route: p.route,
    hasNumeric: Boolean(p.startingPrice),
    startingPrice: p.startingPrice ?? null,
    sourceItemId: p.startingPriceItemId ?? null,
    sourceItemName: item?.name ?? null,
    note: p.startingPriceNote ?? null,
    expected: exp,
  };
});

// ── priceCategories / priceCounts ────────────────────────────────────
const priceCategories: Record<string, number> = {};
let priceItemsTotal = 0;
for (const [cat, expected] of Object.entries(EXPECTED_CATEGORY_COUNTS)) {
  const cnt = PRICES.filter((x) => x.category === (cat as never)).length;
  priceCategories[cat] = cnt;
  priceItemsTotal += cnt;
  if (cnt !== expected) ok(false, `категория ${cat}: ожид. ${expected}, факт ${cnt}`);
}
if (priceItemsTotal !== 98) ok(false, `priceItems != 98 (${priceItemsTotal})`);

// ── renderedPriceGroups / packageSeparation ──────────────────────────
const renderedPriceGroups = engineeringPages.map((p) => {
  const packages = (p.packageCategoryIds ?? []).flatMap((c) => getPricesByCategory(c));
  const sep = (p.priceCategoryIds ?? [])
    .filter((c) => !(p.packageCategoryIds ?? []).includes(c))
    .flatMap((c) => getPricesByCategory(c));
  return {
    route: p.route,
    packageCategoryIds: p.packageCategoryIds ?? [],
    separateCategoryIds: (p.priceCategoryIds ?? []).filter((c) => !(p.packageCategoryIds ?? []).includes(c)),
    packagesCount: packages.length,
    separateCount: sep.length,
    totalRendered: packages.length + sep.length,
  };
});
const packageSeparation = {
  hasPackageCategories: ["electrical_packages", "plumbing_packages", "heating_packages"],
  hasSeparateCategories: ["electrical", "plumbing", "water_supply", "heating", "underfloor_heating"],
  componentPath: "src/components/engineering/EngineeringPriceGroups.tsx",
};

// ── estimateExamples ─────────────────────────────────────────────────
const estimateExamples = engineeringPages.map((p) => ({
  route: p.route,
  itemIds: p.estimateExampleItemIds ?? [],
  allExist: (p.estimateExampleItemIds ?? []).every((id) => Boolean(getPriceById(id))),
}));
for (const e of estimateExamples) {
  if (!e.allExist) ok(false, `${e.route}: estimateExample содержит несуществующие ID`);
}

// ── faqMappings ──────────────────────────────────────────────────────
const faqMappings: Record<string, { ids: string[]; allExist: boolean }> = {};
for (const p of engineeringPages) {
  const allExist = p.faqIds.every((id) => SERVICE_FAQ.some((f) => f.id === id));
  faqMappings[p.route] = { ids: p.faqIds, allExist };
  if (!allExist) ok(false, `${p.route}: FAQ id не найден`);
  if (p.faqIds.length < 5 || p.faqIds.length > 8) ok(false, `${p.route}: ожидается 5–8 FAQ, найдено ${p.faqIds.length}`);
}

// ── relatedServices ──────────────────────────────────────────────────
const relatedServices: Record<string, { declared: string[]; rendered: string[] }> = {};
for (const p of engineeringPages) {
  const resolved = resolveServicePage(p.slug);
  const rendered = resolved?.related.map((r) => r.slug) ?? [];
  relatedServices[p.route] = { declared: p.relatedSlugs, rendered };
  for (const s of rendered) {
    if (!SERVICE_PAGES.some((x) => x.slug === s)) ok(false, `${p.route}: rendered related ${s} отсутствует`);
  }
}

// ── metadata / structuredData ────────────────────────────────────────
const metadata: Record<string, { title: string; description: string; canonical: string; ogUrl: string }> = {};
const structuredData: Record<string, { breadcrumb: boolean; service: boolean; offer: boolean }> = {};
for (const route of EXPECTED_ROUTES) {
  const src = readRoute(route);
  const canonicalUrl = `https://shadov.pro${route}`;
  metadata[route] = {
    title: (src.match(/p\.metaTitle/) ? "from-data" : "missing"),
    description: (src.match(/p\.metaDescription/) ? "from-data" : "missing"),
    canonical: src.includes(`href: "${canonicalUrl}"`) ? canonicalUrl : "mismatch",
    ogUrl: src.includes(`content: "${canonicalUrl}"`) ? canonicalUrl : "mismatch",
  };
  if (metadata[route].canonical !== canonicalUrl) ok(false, `${route}: canonical не совпадает с ${canonicalUrl}`);
  if (metadata[route].ogUrl !== canonicalUrl) ok(false, `${route}: og:url не совпадает с ${canonicalUrl}`);
  structuredData[route] = {
    breadcrumb: /BreadcrumbList/.test(src),
    service: /"@type":\s*"Service"/.test(src),
    offer: /Offer/.test(src),
  };
  // Для страниц без числовой стартовой цены Offer не должно быть.
  const exp = EXPECTED_STARTING[route];
  if (!exp.hasNumeric && structuredData[route].offer) {
    ok(false, `${route}: Offer недопустим без числовой стартовой цены`);
  }
}

// ── illustrations ────────────────────────────────────────────────────
const illustrationSrc = readFileSync(resolve(process.cwd(), "src/components/services/EngineeringServicePage.tsx"), "utf8");
const illustrations = {
  componentImportsIllustration: /import\s+\{\s*Illustration\s*\}/.test(illustrationSrc),
  usesEngineeringPicture: /engineeringPicture/.test(illustrationSrc),
  illustrationKeyAllPages: engineeringPages.every((p) => p.illustrationKey === "direction-engineering"),
};
if (!illustrations.componentImportsIllustration) ok(false, `EngineeringServicePage не импортирует Illustration`);
if (!illustrations.usesEngineeringPicture) ok(false, `EngineeringServicePage не использует engineeringPicture`);
if (!illustrations.illustrationKeyAllPages) ok(false, `illustrationKey != direction-engineering у части страниц`);

// ── accessibility ────────────────────────────────────────────────────
const pricesGroupsSrc = readFileSync(resolve(process.cwd(), "src/components/engineering/EngineeringPriceGroups.tsx"), "utf8");
const accessibility = {
  tableHasCaption: /<caption/.test(pricesGroupsSrc),
  tableHasThead: /<thead/.test(pricesGroupsSrc),
  tableUsesScope: /scope="col"/.test(pricesGroupsSrc),
  horizontalScrollOnTable: /overflow-x-auto/.test(pricesGroupsSrc),
  noSliceFive: !/\.slice\(\s*0\s*,\s*5\s*\)/.test(pricesGroupsSrc),
};
for (const [k, v] of Object.entries(accessibility)) {
  if (!v) ok(false, `accessibility.${k} провален`);
}

// ── forbiddenSearch ──────────────────────────────────────────────────
const SRO = /СРО[\s-]*[№N]?\s*\d/i;
const OWN_LAB = /собственн[а-я]*\s+лаборатори[а-я]+/i;
const WARRANTY = /гаранти[а-я]+\s+\d+\s*(год|года|лет|мес)/i;
const TODO = /TODO|FIXME|lorem ipsum/i;
const matchesOutsideValidator: Array<{ where: string; pattern: string }> = [];
for (const p of engineeringPages) {
  const blob = JSON.stringify(p);
  if (SRO.test(blob)) matchesOutsideValidator.push({ where: p.route, pattern: "SRO" });
  if (OWN_LAB.test(blob)) matchesOutsideValidator.push({ where: p.route, pattern: "own-lab" });
  if (WARRANTY.test(blob)) matchesOutsideValidator.push({ where: p.route, pattern: "warranty" });
  if (TODO.test(blob)) matchesOutsideValidator.push({ where: p.route, pattern: "TODO/FIXME/Lorem" });
}
for (const route of EXPECTED_ROUTES) {
  const src = readRoute(route);
  if (SRO.test(src)) matchesOutsideValidator.push({ where: `route:${route}`, pattern: "SRO" });
  if (OWN_LAB.test(src)) matchesOutsideValidator.push({ where: `route:${route}`, pattern: "own-lab" });
  if (WARRANTY.test(src)) matchesOutsideValidator.push({ where: `route:${route}`, pattern: "warranty" });
  if (TODO.test(src)) matchesOutsideValidator.push({ where: `route:${route}`, pattern: "TODO/FIXME/Lorem" });
}
const forbiddenSearch = { matchesOutsideValidator };
if (matchesOutsideValidator.length) ok(false, `forbiddenSearch: найдено ${matchesOutsideValidator.length}`);

// ── regressionChecks ─────────────────────────────────────────────────
const regressionChecks = {
  constructionPages: SERVICE_PAGES.filter((p) => p.category === "construction").length,
  repairPages: SERVICE_PAGES.filter((p) => p.category === "repair").length,
  engineeringPagesInServicePages: engineeringPages.length,
  servicePagesTotal: SERVICE_PAGES.length,
  pricesRouteExists: existsSync(resolve(process.cwd(), "src/routes/prices.tsx")),
};
if (regressionChecks.constructionPages !== 18) ok(false, `construction != 18`);
if (regressionChecks.repairPages !== 10) ok(false, `repair != 10`);
if (regressionChecks.engineeringPagesInServicePages !== 6) ok(false, `engineering != 6`);
if (regressionChecks.servicePagesTotal !== 34) ok(false, `SERVICE_PAGES total != 34`);

// ── totals ───────────────────────────────────────────────────────────
const totals = {
  engineeringServicePages: engineeringPages.length,
  activeEngineeringRoutes: routeStatus.filter((r) => r.hasEng && !r.stub).length,
  stubEngineeringRoutes: routeStatus.filter((r) => r.stub).length,
  priceCategories: Object.keys(priceCategories).length,
  priceItems: priceItemsTotal,
  engineeringSlugs: ENGINEERING_SLUGS.length,
  engineeringRoutes: ENGINEERING_ROUTES.length,
};
if (totals.engineeringServicePages !== 6) ok(false, `totals.engineeringServicePages != 6`);
if (totals.activeEngineeringRoutes !== 6) ok(false, `totals.activeEngineeringRoutes != 6`);
if (totals.stubEngineeringRoutes !== 0) ok(false, `totals.stubEngineeringRoutes != 0`);
if (totals.priceCategories !== 8) ok(false, `totals.priceCategories != 8`);
if (totals.priceItems !== 98) ok(false, `totals.priceItems != 98`);

const specificationCheck = { passed: errors.length === 0, errors };

const result = {
  stage: STAGE,
  specificationCheck,
  engineeringServicePages,
  duplicateCheck,
  routeStatus,
  pageData,
  startingPrices,
  priceCategories,
  priceCounts: priceCategories,
  renderedPriceGroups,
  packageSeparation,
  estimateExamples,
  faqMappings,
  relatedServices,
  metadata,
  structuredData,
  illustrations,
  accessibility,
  forbiddenSearch,
  regressionChecks,
  totals,
};

const outDir = resolve(process.cwd(), ".audit/stage-2.5.2");
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "audit.json"), JSON.stringify(result, null, 2), "utf8");

const selfPath = resolve(process.cwd(), "src/lib/audit-stage-2-5-2.ts");
if (existsSync(selfPath)) {
  mkdirSync(dirname(resolve(outDir, "audit-source.ts")), { recursive: true });
  writeFileSync(resolve(outDir, "audit-source.ts"), readFileSync(selfPath, "utf8"), "utf8");
}

const exitCode = specificationCheck.passed ? 0 : 1;
writeFileSync(resolve(outDir, "audit-exit-code.txt"), `${exitCode}\n`, "utf8");

if (specificationCheck.passed) {
  console.log("✓ audit:stage-2.5.2 passed.");
  process.exit(0);
}
console.error("✗ audit:stage-2.5.2 failed:");
for (const e of errors) console.error("  -", e);
process.exit(1);