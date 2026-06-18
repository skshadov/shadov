/**
 * Подэтап 2.4.4 — финальный машинный аудит строительного раздела.
 * Подтверждает 18 активных маршрутов, отсутствие RouteStub и noindex,
 * полное наполнение /stroitelstvo и регрессии 2.4.2 / 2.4.3.
 */
import { readFileSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { CONSTRUCTION_SERVICE_PAGES } from "@/data/service-pages-construction";
import { resolveServicePage } from "@/lib/get-service-data";
import { PRICES, getPriceById } from "@/data/prices";
import {
  HOUSE_COMPLETION_DISCLAIMER,
  HOUSE_COMPLETION_LEVELS,
  HOUSE_TECHNOLOGIES,
  HOUSE_TURNKEY_WITH_BASIC_MATERIALS_LABEL,
} from "@/data/house-technologies";

const CONSTRUCTION_ROUTES = [
  "/stroitelstvo",
  "/stroitelstvo-domov-pod-klyuch",
  "/karkasnye-doma",
  "/doma-iz-sip-paneley",
  "/doma-iz-brusa",
  "/doma-iz-kleenogo-brusa",
  "/doma-iz-gazobetona",
  "/doma-iz-keramicheskih-blokov",
  "/kirpichnye-doma",
  "/monolitnye-doma",
  "/kombinirovannye-doma",
  "/mnogokvartirnye-doma",
  "/generalnyy-podryad",
  "/monolitnye-raboty",
  "/fundamenty",
  "/kladochnye-raboty",
  "/krovelnye-raboty",
  "/fasadnye-raboty",
] as const;

const OVERVIEW_ROUTE = "/stroitelstvo";
const OVERVIEW_URL = "https://shadov.pro/stroitelstvo";
const EXPECTED_H1 =
  "Строительство частных и многоквартирных домов в Москве и Московской области";
const EXPECTED_META_TITLE =
  "Строительство домов и зданий в Москве и Московской области — Шадов и партнёры";
const EXPECTED_META_DESCRIPTION =
  "Строительство частных и многоквартирных домов, генеральный подряд, монолитные, фундаментные, кладочные, кровельные и фасадные работы в Москве и Московской области.";

const EXPECTED_DIRECTION_ROUTES = [
  "/stroitelstvo-domov-pod-klyuch",
  "/mnogokvartirnye-doma",
  "/generalnyy-podryad",
  "/monolitnye-raboty",
  "/fundamenty",
  "/kladochnye-raboty",
  "/krovelnye-raboty",
  "/fasadnye-raboty",
] as const;

const EXPECTED_TECHNOLOGY_SLUGS = [
  "karkasnye-doma",
  "doma-iz-sip-paneley",
  "doma-iz-brusa",
  "doma-iz-kleenogo-brusa",
  "doma-iz-gazobetona",
  "doma-iz-keramicheskih-blokov",
  "kirpichnye-doma",
  "monolitnye-doma",
  "kombinirovannye-doma",
] as const;

const EXPECTED_FAQ_IDS = [
  "calc-without-visit",
  "exact-estimate-needs",
  "existing-project",
  "payment-stages",
  "materials-procurement",
  "remote-control",
  "hidden-works",
  "documents-handover",
  "additional-works",
  "single-works",
  "intermediaries",
  "sro-confirmation",
  "after-handover",
] as const;

const ALLOWED_OVERVIEW_ILLUSTRATIONS = new Set(["hero-construction", "construction-directions"]);

const FORBIDDEN_PATTERNS = [
  "Строительство новых домов под ключ",
  "Строительство первых домов под ключом",
  "Строительство любых зданий",
  "Строительство жилых объектов",
  "Строительство домов всех типов",
  "собственная лаборатория",
  "собственный проектный институт",
  "собственный парк техники",
];

const VALIDATOR_ALLOWLIST = new Set([
  "src/lib/validate-content.ts",
  "src/lib/audit-stage-2-4-2.ts",
  "src/lib/audit-stage-2-4-3.ts",
  "src/lib/audit-stage-2-4-4.ts",
]);

const SEARCH_ROOTS = ["src/data", "src/components", "src/routes"];

function readRouteSrc(route: string): string {
  return readFileSync(resolve(process.cwd(), `src/routes${route}.tsx`), "utf8");
}

function findCanonical(src: string): string {
  const urlMatch = src.match(/const\s+URL\s*=\s*"([^"]+)"/);
  if (urlMatch) return urlMatch[1];
  const literal = src.match(/rel:\s*"canonical",\s*href:\s*"([^"]+)"/);
  return literal ? literal[1] : "";
}

function walk(dir: string): string[] {
  const out: string[] = [];
  const abs = resolve(process.cwd(), dir);
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const rel = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

function searchForbidden(): string[] {
  const matches: string[] = [];
  const files: string[] = [];
  for (const root of SEARCH_ROOTS) files.push(...walk(root));
  for (const file of files) {
    if (VALIDATOR_ALLOWLIST.has(file)) continue;
    const src = readFileSync(resolve(process.cwd(), file), "utf8");
    const lines = src.split("\n");
    for (let i = 0; i < lines.length; i++) {
      for (const phrase of FORBIDDEN_PATTERNS) {
        if (lines[i].includes(phrase)) matches.push(`${file}:${i + 1}: ${phrase}`);
      }
    }
  }
  return matches;
}

const errors: string[] = [];
const warnings: string[] = [];

// ── constructionRoutes ────────────────────────────────────────────────
const constructionRoutes = CONSTRUCTION_ROUTES.map((route) => {
  const src = readRouteSrc(route);
  return {
    route,
    usesConstructionServicePage: /ConstructionServicePage/.test(src),
    hasRouteStub: /RouteStub/.test(src),
    hasNoindex: /noindex/i.test(src),
  };
});

for (const r of constructionRoutes) {
  if (!r.usesConstructionServicePage)
    errors.push(`${r.route}: не подключён ConstructionServicePage`);
  if (r.hasRouteStub) errors.push(`${r.route}: остался RouteStub`);
  if (r.hasNoindex) errors.push(`${r.route}: содержит noindex`);
}

// ── overviewPage ──────────────────────────────────────────────────────
const overviewSrc = readRouteSrc(OVERVIEW_ROUTE);
const overviewData = CONSTRUCTION_SERVICE_PAGES.find((p) => p.route === OVERVIEW_ROUTE);
if (!overviewData) errors.push(`overview: данные ${OVERVIEW_ROUTE} не найдены`);

const overviewPage = {
  route: OVERVIEW_ROUTE,
  h1: overviewData?.h1 ?? "",
  startingPrice: overviewData?.startingPrice ?? null,
  metaTitle: overviewData?.metaTitle ?? "",
  metaDescription: overviewData?.metaDescription ?? "",
  canonical: findCanonical(overviewSrc),
  usesConstructionServicePage: /ConstructionServicePage/.test(overviewSrc),
  hasRouteStub: /RouteStub/.test(overviewSrc),
  hasNoindex: /noindex/i.test(overviewSrc),
  directionRoutes: overviewData?.relatedSlugs.map((s) => `/${s}`) ?? [],
  technologyRoutes: EXPECTED_TECHNOLOGY_SLUGS.map((s) => `/${s}`),
  illustrationKeys: overviewData?.illustrationKey ? [overviewData.illustrationKey] : [],
  faqIds: overviewData?.faqIds ?? [],
};

if (overviewPage.h1 !== EXPECTED_H1)
  errors.push(`overview H1: ожидается «${EXPECTED_H1}», найдено «${overviewPage.h1}»`);
if (overviewPage.startingPrice)
  errors.push(`overview: общая стартовая цена недопустима (${overviewPage.startingPrice})`);
if (overviewPage.metaTitle !== EXPECTED_META_TITLE)
  errors.push(
    `overview metaTitle: ожидается «${EXPECTED_META_TITLE}», найдено «${overviewPage.metaTitle}»`,
  );
if (overviewPage.metaDescription !== EXPECTED_META_DESCRIPTION)
  errors.push(
    `overview metaDescription: ожидается «${EXPECTED_META_DESCRIPTION}», найдено «${overviewPage.metaDescription}»`,
  );
if (overviewPage.canonical !== OVERVIEW_URL)
  errors.push(`overview canonical: ожидается ${OVERVIEW_URL}, найдено ${overviewPage.canonical}`);
if (!overviewPage.usesConstructionServicePage)
  errors.push("overview: не подключён ConstructionServicePage");
if (overviewPage.hasRouteStub) errors.push("overview: остался RouteStub");
if (overviewPage.hasNoindex) errors.push("overview: содержит noindex");
if (JSON.stringify(overviewPage.directionRoutes) !== JSON.stringify(EXPECTED_DIRECTION_ROUTES))
  errors.push(
    `overview directions: ожидается ${JSON.stringify(EXPECTED_DIRECTION_ROUTES)}, найдено ${JSON.stringify(overviewPage.directionRoutes)}`,
  );
if (
  JSON.stringify(overviewPage.faqIds) !== JSON.stringify(Array.from(EXPECTED_FAQ_IDS))
)
  errors.push(`overview faqIds: не совпадает с утверждённым списком`);
for (const key of overviewPage.illustrationKeys) {
  if (!ALLOWED_OVERVIEW_ILLUSTRATIONS.has(key))
    errors.push(`overview illustration: недопустимый ключ ${key}`);
}
for (const id of overviewData?.estimateExampleItemIds ?? []) {
  if (!getPriceById(id)) errors.push(`overview estimate: ${id} нет в prices.ts`);
}

// ── technologies / 45 prices ──────────────────────────────────────────
const technologies = HOUSE_TECHNOLOGIES.map((t) => ({
  slug: t.slug,
  name: t.name,
  prices: {
    shell: t.workPrices.shell,
    warmShell: t.workPrices.warmShell,
    preFinish: t.workPrices.preFinish,
    turnkey: t.workPrices.turnkey,
    turnkeyWithBasicMaterials: t.turnkeyWithBasicMaterials,
  },
}));
let comparedTechnologyPrices = 0;
for (const t of HOUSE_TECHNOLOGIES) {
  const pairs: Array<[string, number]> = [
    [`house_construction_work-${t.slug}-shell`, t.workPrices.shell],
    [`house_construction_work-${t.slug}-warm`, t.workPrices.warmShell],
    [`house_construction_work-${t.slug}-prefinish`, t.workPrices.preFinish],
    [`house_construction_work-${t.slug}-turnkey`, t.workPrices.turnkey],
    [`house_construction_materials-${t.slug}-turnkey-materials`, t.turnkeyWithBasicMaterials],
  ];
  for (const [id, expected] of pairs) {
    const item = getPriceById(id);
    if (!item) errors.push(`prices.ts: нет ${id}`);
    else if (item.priceFrom !== expected)
      errors.push(`prices.ts ${id}: ${item.priceFrom} ≠ ${expected}`);
    comparedTechnologyPrices++;
  }
}

// ── completionLevels ──────────────────────────────────────────────────
const completionLevels = HOUSE_COMPLETION_LEVELS.map(({ id, name, included, excluded }) => ({
  id,
  name,
  included,
  excluded,
}));
if (HOUSE_COMPLETION_LEVELS.length !== 4)
  errors.push(`completionLevels ≠ 4 (${HOUSE_COMPLETION_LEVELS.length})`);
if (HOUSE_COMPLETION_DISCLAIMER !==
  "Точный состав комплектации фиксируется в смете и договоре с учётом проекта выбранного дома.")
  errors.push("completionDisclaimer не совпадает");
if (HOUSE_TURNKEY_WITH_BASIC_MATERIALS_LABEL !== "Под ключ с базовыми материалами")
  errors.push("HOUSE_TURNKEY_WITH_BASIC_MATERIALS_LABEL не совпадает");

// ── directionCards ────────────────────────────────────────────────────
const directionsSrc = readFileSync(
  resolve(process.cwd(), "src/components/construction/ConstructionDirections.tsx"),
  "utf8",
);
const directionCards = EXPECTED_DIRECTION_ROUTES.map((route) => {
  const slug = route.replace(/^\//, "");
  const present = directionsSrc.includes(`"${slug}"`);
  if (!present) errors.push(`directionCard ${route}: не найдена в ConstructionDirections.tsx`);
  return { route, present };
});

// ── relatedServices ───────────────────────────────────────────────────
const ACTIVE_SLUG_SET = new Set(CONSTRUCTION_ROUTES.map((r) => r.replace(/^\//, "")));
const relatedServices = CONSTRUCTION_ROUTES.map((route) => {
  const slug = route.replace(/^\//, "");
  const resolved = resolveServicePage(slug);
  const displayedRelatedRoutes = resolved ? resolved.related.map((r) => r.route) : [];
  for (const r of displayedRelatedRoutes) {
    const rSlug = r.replace(/^\//, "");
    if (!ACTIVE_SLUG_SET.has(rSlug))
      errors.push(`related ${route}: неактивный маршрут ${r}`);
  }
  return { route, displayedRelatedRoutes };
});

// ── metadata ──────────────────────────────────────────────────────────
const metadata = {
  route: OVERVIEW_ROUTE,
  hasOgTitle: /og:title/.test(overviewSrc),
  hasOgDescription: /og:description/.test(overviewSrc),
  hasOgUrl: /og:url/.test(overviewSrc),
  hasOgType: /og:type/.test(overviewSrc),
  hasCanonical: /rel:\s*"canonical"/.test(overviewSrc),
};
for (const [k, v] of Object.entries(metadata)) {
  if (typeof v === "boolean" && !v) errors.push(`overview metadata: отсутствует ${k}`);
}

// ── structuredData ────────────────────────────────────────────────────
const structuredData = {
  breadcrumbList: /BreadcrumbList/.test(overviewSrc),
  service: /"@type":\s*"Service"/.test(overviewSrc),
  noOffer: !/"@type":\s*"Offer"/.test(overviewSrc),
  noReview: !/"@type":\s*"Review"/.test(overviewSrc),
  noAggregateRating: !/AggregateRating/.test(overviewSrc),
};
if (!structuredData.breadcrumbList) errors.push("overview: нет BreadcrumbList");
if (!structuredData.service) errors.push("overview: нет Service JSON-LD");
if (!structuredData.noOffer) errors.push("overview: запрещён Offer");
if (!structuredData.noReview) errors.push("overview: запрещён Review");
if (!structuredData.noAggregateRating) errors.push("overview: запрещён AggregateRating");

// ── illustrations ─────────────────────────────────────────────────────
const illustrations = {
  overviewKey: overviewData?.illustrationKey ?? null,
  allowed: overviewData?.illustrationKey
    ? ALLOWED_OVERVIEW_ILLUSTRATIONS.has(overviewData.illustrationKey)
    : false,
};
if (!illustrations.allowed)
  errors.push(`illustrations: недопустимый overview key ${illustrations.overviewKey}`);

// ── accessibility ─────────────────────────────────────────────────────
const matrixSrc = readFileSync(
  resolve(process.cwd(), "src/components/construction/HouseTechnologyMatrix.tsx"),
  "utf8",
);
const accessibility = {
  usesAriaPressed: /aria-pressed=/.test(matrixSrc),
  containsRadioRole: /role=["']radio["']/.test(matrixSrc),
  containsRadioGroupRole: /role=["']radiogroup["']/.test(matrixSrc),
  containsMinHeight44: /min-h-11/.test(matrixSrc),
};
if (!accessibility.usesAriaPressed) errors.push("matrix: нет aria-pressed");
if (accessibility.containsRadioRole) errors.push("matrix: запрещён role=radio");
if (accessibility.containsRadioGroupRole) errors.push("matrix: запрещён role=radiogroup");
if (!accessibility.containsMinHeight44) errors.push("matrix: нет min-h-11");

// ── forbiddenSearch ───────────────────────────────────────────────────
const matchesOutsideValidator = searchForbidden();
if (matchesOutsideValidator.length > 0)
  for (const m of matchesOutsideValidator) errors.push(`forbidden: ${m}`);

// ── regressionChecks ──────────────────────────────────────────────────
const regressionChecks = {
  pricesNonEmpty: PRICES.length > 0,
  technologiesNine: HOUSE_TECHNOLOGIES.length === 9,
  completionLevelsFour: HOUSE_COMPLETION_LEVELS.length === 4,
  constructionPagesEighteen: CONSTRUCTION_SERVICE_PAGES.length === 18,
};
if (!regressionChecks.pricesNonEmpty) errors.push("regression: PRICES пуст");
if (!regressionChecks.technologiesNine) errors.push("regression: technologies ≠ 9");
if (!regressionChecks.completionLevelsFour) errors.push("regression: completion levels ≠ 4");
if (!regressionChecks.constructionPagesEighteen)
  errors.push("regression: construction pages ≠ 18");

// ── totals ────────────────────────────────────────────────────────────
const activeConstructionRoutes = constructionRoutes.filter(
  (r) => r.usesConstructionServicePage && !r.hasRouteStub && !r.hasNoindex,
).length;
const stubConstructionRoutes = constructionRoutes.filter((r) => r.hasRouteStub).length;

const totals = {
  constructionRoutes: constructionRoutes.length,
  activeConstructionRoutes,
  stubConstructionRoutes,
  technologies: technologies.length,
  comparedTechnologyPrices,
  overviewDirections: overviewPage.directionRoutes.length,
  overviewIllustrations: overviewPage.illustrationKeys.length,
};
if (totals.constructionRoutes !== 18)
  errors.push(`constructionRoutes ≠ 18 (${totals.constructionRoutes})`);
if (totals.activeConstructionRoutes !== 18)
  errors.push(`activeConstructionRoutes ≠ 18 (${totals.activeConstructionRoutes})`);
if (totals.stubConstructionRoutes !== 0)
  errors.push(`stubConstructionRoutes ≠ 0 (${totals.stubConstructionRoutes})`);
if (totals.technologies !== 9) errors.push(`technologies ≠ 9 (${totals.technologies})`);
if (totals.comparedTechnologyPrices !== 45)
  errors.push(`comparedTechnologyPrices ≠ 45 (${totals.comparedTechnologyPrices})`);
if (totals.overviewDirections !== 8)
  errors.push(`overviewDirections ≠ 8 (${totals.overviewDirections})`);

const report = {
  stage: "2.4.4",
  specificationCheck: {
    passed: errors.length === 0,
    errors,
    warnings,
  },
  constructionRoutes,
  overviewPage,
  technologies,
  completionLevels,
  directionCards,
  relatedServices,
  metadata,
  structuredData,
  illustrations,
  accessibility,
  forbiddenSearch: {
    patterns: FORBIDDEN_PATTERNS,
    matchesOutsideValidator,
  },
  regressionChecks,
  totals,
};

console.log(JSON.stringify(report, null, 2));
process.exit(errors.length === 0 ? 0 : 1);