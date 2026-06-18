/**
 * Подэтап 2.4.3 — машинный аудит подключения семи специализированных
 * строительных страниц. Формирует единый JSON-отчёт без ручного пересказа.
 */
import { readFileSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { CONSTRUCTION_SERVICE_PAGES } from "@/data/service-pages-construction";
import { resolveServicePage } from "@/lib/get-service-data";
import { PRICES, getPriceById } from "@/data/prices";

const STAGE_ROUTES = [
  "/mnogokvartirnye-doma",
  "/generalnyy-podryad",
  "/monolitnye-raboty",
  "/fundamenty",
  "/kladochnye-raboty",
  "/krovelnye-raboty",
  "/fasadnye-raboty",
] as const;

const ACTIVE_CONSTRUCTION_ROUTES = [
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
  ...STAGE_ROUTES,
] as const;

const STUB_CONSTRUCTION_ROUTES: readonly string[] = [];

const EXPECTED_H1: Record<string, string> = {
  "/mnogokvartirnye-doma":
    "Строительство многоквартирных домов в качестве генерального подрядчика",
  "/generalnyy-podryad": "Генеральный подряд с единым центром ответственности",
  "/monolitnye-raboty":
    "Монолитные работы с инженерным, геодезическим и документальным контролем",
  "/fundamenty": "Устройство фундаментов для частных и многоквартирных зданий",
  "/kladochnye-raboty":
    "Кладочные работы с контролем геометрии, перевязки и конструктивных узлов",
  "/krovelnye-raboty": "Кровельные работы для частных домов и зданий",
  "/fasadnye-raboty": "Фасадные работы и наружная отделка зданий",
};

const EXPECTED_STARTING_PRICE: Record<string, string | null> = {
  "/mnogokvartirnye-doma": null,
  "/generalnyy-podryad": "от 3% стоимости СМР",
  "/monolitnye-raboty": "от 18 000 ₽/м³ за комплексные работы по фундаментной плите",
  "/fundamenty": null,
  "/kladochnye-raboty": "от 7 000 ₽/м³",
  "/krovelnye-raboty": "от 3 500 ₽/м² за комплекс холодной скатной кровли",
  "/fasadnye-raboty": "от 1 800 ₽/м² за монтаж винилового сайдинга",
};

const EXPECTED_PRICE_CATEGORIES: Record<string, string[]> = {
  "/mnogokvartirnye-doma": ["general_contracting", "monolithic"],
  "/generalnyy-podryad": ["general_contracting"],
  "/monolitnye-raboty": ["monolithic"],
  "/fundamenty": ["foundations"],
  "/kladochnye-raboty": ["masonry"],
  "/krovelnye-raboty": ["roofing"],
  "/fasadnye-raboty": ["facades"],
};

const EXPECTED_ILLUSTRATION: Record<string, string> = {
  "/mnogokvartirnye-doma": "hero-construction",
  "/generalnyy-podryad": "hero-construction",
  "/monolitnye-raboty": "direction-monolith",
  "/fundamenty": "direction-monolith",
  "/kladochnye-raboty": "direction-houses",
  "/krovelnye-raboty": "direction-houses",
  "/fasadnye-raboty": "direction-houses",
};

const ALLOWED_ILLUSTRATIONS = new Set([
  "direction-houses",
  "hero-construction",
  "direction-monolith",
]);

const EXPECTED_CATEGORY_COUNTS: Record<string, number> = {
  general_contracting: 7,
  monolithic: 20,
  foundations: 20,
  masonry: 18,
  facades: 15,
};

const FORBIDDEN_PATTERNS = [
  "Строительство новых домов под ключ",
  "Строительство первых домов под ключом",
  "собственная лаборатория",
  "собственный проектный институт",
  "собственный парк техники",
  "застройщик объекта",
];

const VALIDATOR_ALLOWLIST = new Set([
  "src/lib/validate-content.ts",
  "src/lib/audit-stage-2-4-2.ts",
  "src/lib/audit-stage-2-4-3.ts",
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

// ── pages ──────────────────────────────────────────────────────────────
const pages = STAGE_ROUTES.map((route) => {
  const slug = route.replace(/^\//, "");
  const src = readRouteSrc(route);
  const page = CONSTRUCTION_SERVICE_PAGES.find((p) => p.route === route);
  if (!page) errors.push(`route ${route}: страница не найдена в данных`);
  const usesConstructionServicePage = /ConstructionServicePage/.test(src);
  const hasRouteStub = /RouteStub/.test(src);
  const hasNoindex = /noindex/i.test(src);
  const canonical = findCanonical(src);
  const breadcrumbList = /BreadcrumbList/.test(src);
  const hasOgTitle = /og:title/.test(src);
  const hasOgUrl = /og:url/.test(src);
  const hasOgDescription = /og:description/.test(src);
  if (!usesConstructionServicePage)
    errors.push(`route ${route}: не подключён ConstructionServicePage`);
  if (hasRouteStub) errors.push(`route ${route}: всё ещё RouteStub`);
  if (hasNoindex) errors.push(`route ${route}: содержит noindex`);
  if (!breadcrumbList) errors.push(`route ${route}: отсутствует BreadcrumbList`);
  if (!hasOgTitle || !hasOgUrl || !hasOgDescription)
    errors.push(`route ${route}: неполный Open Graph`);
  if (canonical !== `https://shadov.pro${route}`)
    errors.push(`route ${route}: canonical=${canonical}, ожидается https://shadov.pro${route}`);
  if (page && EXPECTED_H1[route] && page.h1 !== EXPECTED_H1[route]) {
    errors.push(
      `route ${route}: H1 не совпадает.\n  ожидается: ${EXPECTED_H1[route]}\n  найдено:   ${page.h1}`,
    );
  }
  const expPrice = EXPECTED_STARTING_PRICE[route];
  if (expPrice === null && page && page.startingPrice) {
    errors.push(`route ${route}: общая стартовая цена недопустима (${page.startingPrice})`);
  }
  if (expPrice && page && page.startingPrice !== expPrice) {
    errors.push(
      `route ${route}: startingPrice не совпадает.\n  ожидается: ${expPrice}\n  найдено:   ${page.startingPrice}`,
    );
  }
  const expCats = EXPECTED_PRICE_CATEGORIES[route];
  if (page && JSON.stringify(page.priceCategoryIds) !== JSON.stringify(expCats)) {
    errors.push(
      `route ${route}: priceCategoryIds не совпадает.\n  ожидается: ${JSON.stringify(expCats)}\n  найдено:   ${JSON.stringify(page.priceCategoryIds)}`,
    );
  }
  const expIllustration = EXPECTED_ILLUSTRATION[route];
  if (page && page.illustrationKey !== expIllustration) {
    errors.push(
      `route ${route}: illustrationKey не совпадает.\n  ожидается: ${expIllustration}\n  найдено:   ${page.illustrationKey}`,
    );
  }
  if (page && page.illustrationKey && !ALLOWED_ILLUSTRATIONS.has(page.illustrationKey)) {
    errors.push(`route ${route}: недопустимый illustrationKey=${page.illustrationKey}`);
  }
  if (page) {
    for (const id of page.estimateExampleItemIds ?? []) {
      if (!getPriceById(id)) {
        errors.push(`route ${route}: estimate item ${id} отсутствует в prices.ts`);
      }
    }
  }
  return {
    route,
    slug,
    h1: page?.h1 ?? "",
    startingPrice: page?.startingPrice ?? null,
    priceCategoryIds: page?.priceCategoryIds ?? [],
    estimateExampleItemIds: page?.estimateExampleItemIds ?? [],
    illustrationKey: page?.illustrationKey ?? null,
    usesConstructionServicePage,
    hasRouteStub,
    hasNoindex,
    canonical,
  };
});

// ── stubs ──────────────────────────────────────────────────────────────
const stubs = STUB_CONSTRUCTION_ROUTES.map((route) => {
  const src = readRouteSrc(route);
  const hasRouteStub = /RouteStub/.test(src);
  const hasNoindexFollow = /noindex,\s*follow/.test(src);
  const usesConstructionServicePage = /ConstructionServicePage/.test(src);
  if (!hasRouteStub) errors.push(`stub ${route}: должен оставаться RouteStub`);
  if (!hasNoindexFollow) errors.push(`stub ${route}: должен сохранять noindex, follow`);
  if (usesConstructionServicePage)
    errors.push(`stub ${route}: не должен подключать ConstructionServicePage`);
  return { route, hasRouteStub, hasNoindexFollow, usesConstructionServicePage };
});

// ── activeConstructionRoutes / stubConstructionRoutes ─────────────────
const activeConstructionRoutes = ACTIVE_CONSTRUCTION_ROUTES.map((route) => {
  const src = readRouteSrc(route);
  return {
    route,
    usesConstructionServicePage: /ConstructionServicePage/.test(src),
    hasRouteStub: /RouteStub/.test(src),
    hasNoindex: /noindex/i.test(src),
  };
});
const stubConstructionRoutes = stubs;

for (const r of activeConstructionRoutes) {
  if (!r.usesConstructionServicePage)
    errors.push(`active ${r.route}: нет ConstructionServicePage`);
  if (r.hasRouteStub) errors.push(`active ${r.route}: остался RouteStub`);
  if (r.hasNoindex) errors.push(`active ${r.route}: содержит noindex`);
}

// ── priceCategories / priceCounts ─────────────────────────────────────
const priceCounts: Record<string, number> = {};
for (const [cat, expected] of Object.entries(EXPECTED_CATEGORY_COUNTS)) {
  const items = PRICES.filter((x) => x.category === (cat as never));
  priceCounts[cat] = items.length;
  if (items.length !== expected) {
    errors.push(`категория ${cat}: ожидается ${expected}, найдено ${items.length}`);
  }
}
const roofingAll = PRICES.filter((x) => x.category === ("roofing" as never));
const roofingComplex = roofingAll.filter((x) => x.id.startsWith("roofing-complex-"));
const roofingSeparate = roofingAll.filter((x) => !x.id.startsWith("roofing-complex-"));
priceCounts.roofingSeparate = roofingSeparate.length;
priceCounts.roofingComplex = roofingComplex.length;
if (roofingSeparate.length !== 21)
  errors.push(`кровля: ожидается 21 отдельная работа, найдено ${roofingSeparate.length}`);
if (roofingComplex.length !== 7)
  errors.push(`кровля: ожидается 7 комплексных решений, найдено ${roofingComplex.length}`);

const priceCategories = Object.keys(EXPECTED_CATEGORY_COUNTS).concat(["roofing"]);

// ── estimateExamples ──────────────────────────────────────────────────
const estimateExamples = pages.map((p) => ({
  route: p.route,
  ids: p.estimateExampleItemIds,
  allIdsResolved: p.estimateExampleItemIds.every((id) => Boolean(getPriceById(id))),
}));

// ── relatedServices ───────────────────────────────────────────────────
const ACTIVE_SLUG_SET = new Set(
  ACTIVE_CONSTRUCTION_ROUTES.map((r) => r.replace(/^\//, "")),
);
const relatedServices = STAGE_ROUTES.map((route) => {
  const slug = route.replace(/^\//, "");
  const resolved = resolveServicePage(slug);
  const displayedRelatedRoutes = resolved ? resolved.related.map((r) => r.route) : [];
  for (const r of displayedRelatedRoutes) {
    if (r === "/stroitelstvo") {
      errors.push(`related ${route}: /stroitelstvo не должен быть в связанных услугах`);
    }
    const rSlug = r.replace(/^\//, "");
    if (!ACTIVE_SLUG_SET.has(rSlug)) {
      // Допускаются также активные технологии (они входят в ACTIVE_SLUG_SET).
      errors.push(`related ${route}: содержит неактивный маршрут ${r}`);
    }
  }
  return { route, displayedRelatedRoutes };
});

// ── metadata ──────────────────────────────────────────────────────────
const metadata = STAGE_ROUTES.map((route) => {
  const src = readRouteSrc(route);
  return {
    route,
    hasOgTitle: /og:title/.test(src),
    hasOgDescription: /og:description/.test(src),
    hasOgUrl: /og:url/.test(src),
    hasOgType: /og:type/.test(src),
    hasCanonical: /rel:\s*"canonical"/.test(src),
    hasBreadcrumbList: /BreadcrumbList/.test(src),
    hasServiceJsonLd: /"@type":\s*"Service"/.test(src),
  };
});

// ── illustrations ─────────────────────────────────────────────────────
const illustrations = pages.map((p) => ({
  route: p.route,
  illustrationKey: p.illustrationKey,
  allowedKey: p.illustrationKey ? ALLOWED_ILLUSTRATIONS.has(p.illustrationKey) : false,
  matchesRecommendation:
    p.illustrationKey === EXPECTED_ILLUSTRATION[p.route],
}));
for (const it of illustrations) {
  if (!it.allowedKey)
    errors.push(`illustration ${it.route}: недопустимый ключ ${it.illustrationKey}`);
  if (!it.matchesRecommendation)
    errors.push(`illustration ${it.route}: не соответствует рекомендации`);
}

// ── accessibility ────────────────────────────────────────────────────
const matrixSrc = readFileSync(
  resolve(process.cwd(), "src/components/construction/HouseTechnologyMatrix.tsx"),
  "utf8",
);
const accessibility = {
  usesAriaPressed: /aria-pressed=/.test(matrixSrc),
  containsRadioRole: /role=["']radio["']/.test(matrixSrc),
  containsRadioGroupRole: /role=["']radiogroup["']/.test(matrixSrc),
  containsMinHeight44: /min-h-11/.test(matrixSrc),
  containsMinWidth44: /min-w-11/.test(matrixSrc),
};
if (!accessibility.usesAriaPressed) errors.push("HouseTechnologyMatrix: нет aria-pressed");
if (accessibility.containsRadioRole) errors.push("HouseTechnologyMatrix: запрещён role=radio");
if (accessibility.containsRadioGroupRole)
  errors.push("HouseTechnologyMatrix: запрещён role=radiogroup");
if (!accessibility.containsMinHeight44) errors.push("HouseTechnologyMatrix: нет min-h-11");
if (!accessibility.containsMinWidth44) errors.push("HouseTechnologyMatrix: нет min-w-11");

// ── forbiddenSearch ───────────────────────────────────────────────────
const matchesOutsideValidator = searchForbidden();
if (matchesOutsideValidator.length > 0) {
  for (const m of matchesOutsideValidator) errors.push(`forbidden: ${m}`);
}

// ── totals ────────────────────────────────────────────────────────────
const totals = {
  activeConstructionRoutes: activeConstructionRoutes.length,
  stubConstructionRoutes: stubConstructionRoutes.length,
  stageRoutes: pages.length,
};
if (totals.activeConstructionRoutes !== 18)
  errors.push(`activeConstructionRoutes ≠ 18 (${totals.activeConstructionRoutes})`);
if (totals.stubConstructionRoutes !== 0)
  errors.push(`stubConstructionRoutes ≠ 0 (${totals.stubConstructionRoutes})`);
if (totals.stageRoutes !== 7) errors.push(`stageRoutes ≠ 7 (${totals.stageRoutes})`);

const report = {
  stage: "2.4.3",
  specificationCheck: {
    passed: errors.length === 0,
    errors,
    warnings,
  },
  activeConstructionRoutes,
  stubConstructionRoutes,
  pages,
  priceCategories,
  priceCounts,
  estimateExamples,
  relatedServices,
  metadata,
  illustrations,
  accessibility,
  forbiddenSearch: {
    patterns: FORBIDDEN_PATTERNS,
    matchesOutsideValidator,
  },
  totals,
};

console.log(JSON.stringify(report, null, 2));
process.exit(errors.length === 0 ? 0 : 1);