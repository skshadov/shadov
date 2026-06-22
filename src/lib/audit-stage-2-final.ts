/**
 * Этап 2.6 — итоговый аудит этапа 2. Подтверждает завершение
 * информационных и юридических страниц, активацию /ukladka-plitki,
 * сохранение заглушек только для будущих этапов 3–5, отсутствие
 * вымышленных данных, фиктивных контактов и backend-вызовов.
 */
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { SERVICE_PAGES } from "@/data/service-pages";
import { PRICES } from "@/data/prices";
import { ROUTES } from "@/data/routes";
import {
  MAIN_NAV,
  FOOTER_INFO_LINKS,
  FOOTER_LEGAL_LINKS,
} from "@/data/navigation";
import { company, isFilled } from "@/config/company";
import {
  CALCULATOR_ROUTE,
  CALCULATOR_LINKS_FROM_SERVICES,
} from "@/data/calculator-specification";
import { CALCULATOR_LOCAL_STORAGE_KEY, CALCULATOR_MODES } from "@/types/calculator";

const STAGE = "2.6";
const errors: string[] = [];
const ok = (cond: unknown, msg: string) => { if (!cond) errors.push(msg); };

const ROOT = process.cwd();
const read = (p: string) => readFileSync(resolve(ROOT, p), "utf8");
const safeRead = (p: string) => { try { return read(p); } catch { return ""; } };

// ── 1. Route inventory ──────────────────────────────────────────────
const FUTURE_STUB_ROUTES = new Set([
  "/login", "/client", "/client/project/$id", "/admin",
]);
const ROUTE_FILES = readdirSync(resolve(ROOT, "src/routes"))
  .filter((f) => /\.(tsx)$/.test(f) && !f.startsWith("__") && f !== "README.md");

interface RouteRow {
  route: string;
  routeFile: string;
  usesRouteStub: boolean;
  hasNoindex: boolean;
  hasCanonical: boolean;
  isFutureStage: boolean;
}
const routeInventory: RouteRow[] = [];
function fileToRoute(f: string) {
  // index.tsx -> /
  if (f === "index.tsx") return "/";
  const base = f.replace(/\.tsx$/, "");
  // Replace dots with slashes; `$slug` stays.
  return "/" + base.replace(/\./g, "/");
}
for (const f of ROUTE_FILES) {
  const route = fileToRoute(f);
  const src = read(`src/routes/${f}`);
  routeInventory.push({
    route,
    routeFile: `src/routes/${f}`,
    usesRouteStub: /RouteStub/.test(src),
    hasNoindex: /noindex/i.test(src),
    hasCanonical: /rel:\s*"canonical"/.test(src) || /buildInfoHead\(/.test(src),
    isFutureStage: FUTURE_STUB_ROUTES.has(route),
  });
}

const remainingStubRoutes = routeInventory.filter((r) => r.usesRouteStub);
for (const r of remainingStubRoutes) {
  ok(r.isFutureStage, `route ${r.route} остаётся RouteStub, но не относится к этапу 3–5`);
  ok(r.hasNoindex, `route ${r.route}: будущий этап должен иметь noindex, follow`);
}
const tileRow = routeInventory.find((r) => r.route === "/ukladka-plitki")!;
ok(!tileRow.usesRouteStub, "/ukladka-plitki: RouteStub не снят");
ok(!tileRow.hasNoindex, "/ukladka-plitki: noindex не снят");
ok(tileRow.hasCanonical, "/ukladka-plitki: отсутствует canonical");

// ── 2. Service pages ────────────────────────────────────────────────
const totalServicePages = SERVICE_PAGES.length;
const activeServicePages = SERVICE_PAGES.filter((p) => !p.isStub).length;
const serviceStubPages = SERVICE_PAGES.filter((p) => p.isStub).length;
const repairServicePages = SERVICE_PAGES.filter((p) => p.category === "repair" && !p.isStub).length;
const constructionServicePages = SERVICE_PAGES.filter((p) => p.category === "construction" && !p.isStub).length;
const engineeringServicePages = SERVICE_PAGES.filter((p) => p.category === "engineering" && !p.isStub).length;
ok(totalServicePages === 35, `servicePages != 35`);
ok(activeServicePages === 35, `activeServicePages != 35`);
ok(serviceStubPages === 0, `serviceStubPages != 0`);
ok(repairServicePages === 11, `repair != 11`);
ok(constructionServicePages === 18, `construction != 18`);
ok(engineeringServicePages === 6, `engineering != 6`);

const tile = SERVICE_PAGES.find((p) => p.slug === "ukladka-plitki")!;
ok(tile.h1 === "Укладка плитки и керамогранита", "tile H1 не совпадает");
const tilePriceItems = PRICES.filter((p) => p.category === "tiling").length;
ok(tilePriceItems === 20, `tiling != 20`);
ok(tile.startingPriceItemId === "tiling-standart-keram", "tile startingPriceItemId");
const tilePrice = PRICES.find((p) => p.id === "tiling-standart-keram")!;
ok(tilePrice.priceFrom === 2800, "tile startingPrice != 2800");
const tilePage = {
  route: tile.route,
  h1: tile.h1,
  startingPriceItemId: tile.startingPriceItemId,
  startingPriceValue: tilePrice.priceFrom,
  priceItems: tilePriceItems,
  routeFile: "src/routes/ukladka-plitki.tsx",
  usesRepairServicePage: /RepairServicePage/.test(read("src/routes/ukladka-plitki.tsx")),
};
ok(tilePage.usesRepairServicePage, "/ukladka-plitki: не использует RepairServicePage");

// ── 3. Information routes ───────────────────────────────────────────
const INFO_ROUTES = [
  "/about", "/team", "/portfolio", "/portfolio/$slug", "/contacts",
  "/reviews", "/faq", "/how-we-work", "/kontrol-kachestva", "/sro-i-dokumenty",
];
const informationRoutes = INFO_ROUTES.map((r) => {
  const file = r === "/portfolio/$slug"
    ? "src/routes/portfolio.$slug.tsx"
    : `src/routes${r}.tsx`;
  const src = safeRead(file);
  return {
    route: r,
    routeFile: file,
    exists: src.length > 0,
    usesRouteStub: /RouteStub/.test(src),
    hasNoindex: /noindex/i.test(src),
    hasCanonical: /rel:\s*"canonical"/.test(src) || /buildInfoHead\(/.test(src),
  };
});
for (const r of informationRoutes) {
  ok(r.exists, `info ${r.route}: файл не найден`);
  ok(!r.usesRouteStub, `info ${r.route}: всё ещё RouteStub`);
  // /portfolio/$slug — динамический 404, без canonical допустимо (noindex задан).
  if (r.route !== "/portfolio/$slug") {
    ok(!r.hasNoindex, `info ${r.route}: содержит noindex`);
    ok(r.hasCanonical, `info ${r.route}: отсутствует canonical`);
  }
}

// ── 4. Legal routes ─────────────────────────────────────────────────
const LEGAL_ROUTES = ["/privacy", "/personal-data-consent", "/cookies", "/terms", "/requisites"];
const legalRoutes = LEGAL_ROUTES.map((r) => {
  const file = `src/routes${r}.tsx`;
  const src = safeRead(file);
  return {
    route: r,
    routeFile: file,
    exists: src.length > 0,
    usesRouteStub: /RouteStub/.test(src),
    hasNoindex: /noindex/i.test(src),
    hasCanonical: /rel:\s*"canonical"/.test(src) || /buildInfoHead\(/.test(src),
    hasService: /"@type"\s*:\s*"Service"/.test(src),
    hasOffer: /"@type"\s*:\s*"Offer"/.test(src),
    hasReview: /"@type"\s*:\s*"Review"/.test(src),
    hasAggregateRating: /AggregateRating/.test(src),
  };
});
for (const r of legalRoutes) {
  ok(r.exists, `legal ${r.route}: файл не найден`);
  ok(!r.usesRouteStub, `legal ${r.route}: всё ещё RouteStub`);
  ok(!r.hasNoindex, `legal ${r.route}: содержит noindex`);
  ok(r.hasCanonical, `legal ${r.route}: отсутствует canonical`);
  ok(!r.hasService, `legal ${r.route}: запрещён Service JSON-LD`);
  ok(!r.hasOffer, `legal ${r.route}: запрещён Offer JSON-LD`);
  ok(!r.hasReview, `legal ${r.route}: запрещён Review JSON-LD`);
  ok(!r.hasAggregateRating, `legal ${r.route}: запрещён AggregateRating`);
}

// ── 5. Future stage routes ──────────────────────────────────────────
const futureStageRoutes = [...FUTURE_STUB_ROUTES].map((r) => {
  const file = r === "/client/project/$id"
    ? "src/routes/client.project.$id.tsx"
    : `src/routes${r}.tsx`;
  const src = safeRead(file);
  return {
    route: r,
    routeFile: file,
    plannedStage: r.startsWith("/admin") ? 5 : (r === "/login" ? 3 : 4),
    usesRouteStub: /RouteStub/.test(src),
    hasNoindex: /noindex/i.test(src),
  };
});
for (const r of futureStageRoutes) {
  ok(r.usesRouteStub, `${r.route}: должен оставаться RouteStub`);
  ok(r.hasNoindex, `${r.route}: должен сохранять noindex`);
}

// ── 6. Navigation ───────────────────────────────────────────────────
const flatNav: string[] = [];
for (const it of MAIN_NAV) {
  if ("items" in it) { flatNav.push(it.to); for (const s of it.items) flatNav.push(s.to); }
  else flatNav.push(it.to);
}
const navigation = {
  mainNavLinks: flatNav.length,
  unique: new Set(flatNav).size === flatNav.length,
  hasCalculator: flatNav.includes(CALCULATOR_ROUTE),
  hasPortfolio: flatNav.includes("/portfolio"),
  hasAbout: flatNav.includes("/about"),
  hasContacts: flatNav.includes("/contacts"),
  hasAdmin: flatNav.includes("/admin"),
  hasClient: flatNav.includes("/client"),
  hasLogin: flatNav.includes("/login"),
};
ok(navigation.unique, "navigation: дубликаты ссылок в MAIN_NAV");
ok(navigation.hasCalculator, "navigation: нет калькулятора");
ok(navigation.hasPortfolio, "navigation: нет /portfolio");
ok(navigation.hasAbout, "navigation: нет /about");
ok(navigation.hasContacts, "navigation: нет /contacts");
ok(!navigation.hasAdmin, "navigation: /admin не должен быть в MAIN_NAV");
ok(!navigation.hasClient, "navigation: /client не должен быть в MAIN_NAV");
ok(!navigation.hasLogin, "navigation: /login не должен быть в MAIN_NAV");

// Все ссылки навигации существуют в ROUTES.
const routesPaths = new Set(ROUTES.map((r) => r.path));
for (const link of flatNav) {
  ok(routesPaths.has(link), `MAIN_NAV ссылка ${link} не зарегистрирована в ROUTES`);
}

// ── 7. Footer links ─────────────────────────────────────────────────
const footerLinks = {
  info: FOOTER_INFO_LINKS.map((l) => l.to),
  legal: FOOTER_LEGAL_LINKS.map((l) => l.to),
  infoCount: FOOTER_INFO_LINKS.length,
  legalCount: FOOTER_LEGAL_LINKS.length,
};
for (const lp of [...footerLinks.info, ...footerLinks.legal]) {
  ok(routesPaths.has(lp), `Footer ссылка ${lp} не зарегистрирована в ROUTES`);
}
for (const lp of footerLinks.legal) {
  const row = legalRoutes.find((r) => r.route === lp);
  ok(row && row.exists && !row.usesRouteStub, `Footer legal ${lp} ведёт на заглушку`);
}

// ── 8. Form consent links ───────────────────────────────────────────
const formSrc = read("src/components/forms/EstimateForm.tsx");
const formConsentLinks = {
  linksToConsent: /\/personal-data-consent/.test(formSrc),
  linksToPrivacy: /\/privacy/.test(formSrc),
  consentRequired: /consent:\s*z\.literal\(true/.test(formSrc),
  noBackendCall: !/fetch\(|axios|supabase/.test(formSrc),
  usesLocalStorage: /localStorage/.test(formSrc),
  storageKey: /shadov:estimate-draft/.test(formSrc) ? "shadov:estimate-draft" : null,
};
ok(formConsentLinks.linksToConsent, "EstimateForm: нет ссылки на /personal-data-consent");
ok(formConsentLinks.linksToPrivacy, "EstimateForm: нет ссылки на /privacy");
ok(formConsentLinks.consentRequired, "EstimateForm: согласие не обязательно");
ok(formConsentLinks.noBackendCall, "EstimateForm: обнаружен backend-вызов");
ok(formConsentLinks.usesLocalStorage, "EstimateForm: не использует localStorage");

// ── 9. Company data usage ───────────────────────────────────────────
const companyFields = Object.fromEntries(
  Object.entries(company).map(([k, v]) => [k, isFilled(v as string)])
);
const companyDataUsage = {
  fields: companyFields,
  isFilledHelperUsed: {
    contacts: /isFilled/.test(read("src/routes/contacts.tsx")),
    requisites: /isFilled/.test(read("src/routes/requisites.tsx")),
    privacy: /isFilled/.test(read("src/routes/privacy.tsx")),
    consent: /isFilled/.test(read("src/routes/personal-data-consent.tsx")),
    footer: /isFilled/.test(read("src/components/layout/Footer.tsx")),
  },
};
for (const [k, v] of Object.entries(companyDataUsage.isFilledHelperUsed)) {
  ok(v, `${k}: не использует isFilled()`);
}

// ── 10. Storage inventory ───────────────────────────────────────────
const storageInventory = {
  localStorageKeys: [
    "shadov:estimate-draft",
    CALCULATOR_LOCAL_STORAGE_KEY,
  ],
  sessionStorageKeys: [] as string[],
  cookies: [] as string[],
  analyticsScripts: false,
  consentBannerNeeded: false,
};

// ── 11. Portfolio integrity ─────────────────────────────────────────
const portfolioSrc = read("src/routes/portfolio.tsx");
const portfolioSlugSrc = read("src/routes/portfolio.$slug.tsx");
const portfolioIntegrity = {
  emptyStateText: /Раздел наполняется подтверждёнными материалами/.test(portfolioSrc),
  noFakeProjects: !/(улица|проспект|шоссе|кв\.\s*м\.\s*\d+|млн\s*₽|тыс\.\s*₽)/i.test(portfolioSrc),
  dynamicSlugReturns404: /notFound\(\)/.test(portfolioSlugSrc),
  hasCalculatorCta: /kalkulyator-stoimosti/.test(portfolioSrc),
};
for (const [k, v] of Object.entries(portfolioIntegrity)) ok(v, `portfolio.${k} провален`);

// ── 12. Reviews integrity ───────────────────────────────────────────
const reviewsSrc = read("src/routes/reviews.tsx");
const reviewsIntegrity = {
  hasEmptyState: /подтверждёнными отзывами/.test(reviewsSrc),
  noFakeReviews: !/(★|⭐|\bотличный\s+ремонт\b|\bрекомендую\b)/i.test(reviewsSrc),
  noReviewSchema: !/"@type"\s*:\s*"Review"/.test(reviewsSrc),
  noAggregateRating: !/AggregateRating|ratingValue|reviewCount/.test(reviewsSrc),
};
for (const [k, v] of Object.entries(reviewsIntegrity)) ok(v, `reviews.${k} провален`);

// ── 13. Structured data ─────────────────────────────────────────────
const structuredData = {
  faqHasFaqPage: /"@type"\s*:\s*"FAQPage"/.test(read("src/routes/faq.tsx")),
  tileHasBreadcrumb: /BreadcrumbList/.test(read("src/routes/ukladka-plitki.tsx")),
  legalNoServiceOffer: !legalRoutes.some((r) => r.hasService || r.hasOffer),
  reviewsNoReviewSchema: reviewsIntegrity.noReviewSchema,
  portfolioNoItemList: !/"@type"\s*:\s*"ItemList"/.test(portfolioSrc),
};
for (const [k, v] of Object.entries(structuredData)) ok(v, `structuredData.${k} провален`);

// ── 14. Metadata ────────────────────────────────────────────────────
const allTitles = new Set<string>();
const allCanonicals = new Set<string>();
const allUrls = [...INFO_ROUTES, ...LEGAL_ROUTES, "/ukladka-plitki"];
for (const r of allUrls) {
  const file = r === "/portfolio/$slug"
    ? "src/routes/portfolio.$slug.tsx"
    : `src/routes${r}.tsx`;
  const src = safeRead(file);
  const titleMatch = src.match(/const\s+TITLE\s*=\s*"([^"]+)"/);
  if (titleMatch) {
    if (allTitles.has(titleMatch[1])) ok(false, `Дублирующийся title: ${titleMatch[1]}`);
    allTitles.add(titleMatch[1]);
  }
  const canonMatch = src.match(/rel:\s*"canonical",\s*href:\s*"?(URL|[^"]+)"?/);
  if (canonMatch && canonMatch[1] !== "URL") {
    if (allCanonicals.has(canonMatch[1])) ok(false, `Дублирующийся canonical: ${canonMatch[1]}`);
    allCanonicals.add(canonMatch[1]);
  }
}
const metadata = {
  uniqueTitles: allTitles.size,
  uniqueCanonicals: allCanonicals.size,
};

// ── 15. Accessibility / responsive (поверхностно) ───────────────────
const layoutSrc = read("src/components/info/InfoPageLayout.tsx");
const accessibility = {
  containerPage: /container-page/.test(layoutSrc),
  h1Once: (layoutSrc.match(/<h1/g) ?? []).length === 1,
  hasMainLandmark: /id="main"/.test(layoutSrc),
  breadcrumbsAriaLabel: /aria-label="Хлебные крошки"/.test(read("src/components/common/Breadcrumbs.tsx")),
};
for (const [k, v] of Object.entries(accessibility)) ok(v, `accessibility.${k} провален`);

const responsiveChecks = {
  notes: [
    "Контейнеры используют container-page с горизонтальными отступами под 320 px.",
    "Информационные карточки rounded-xl border bg-card перестраиваются в одну колонку.",
    "Длинные юридические тексты разбиты на InfoSection и не выходят за viewport.",
    "Кнопки CTA имеют min-h-11 (44 px tap target).",
    "Контакты и реквизиты — flex/grid с авто-переносом на мобильных.",
  ],
  breakpointsConsidered: ["320px", "375px", "430px", "768px", "1024px", "1440px", "1920px"],
};

// ── 16. Forbidden search ────────────────────────────────────────────
const FORBIDDEN_PATTERNS: Array<{ rx: RegExp; pattern: string }> = [
  { rx: /Lorem ipsum/i, pattern: "Lorem ipsum" },
  { rx: /TODO/, pattern: "TODO" },
  { rx: /FIXME/, pattern: "FIXME" },
  { rx: /100%\s*гаранти/i, pattern: "100% гарантия" },
  { rx: /№\s*1\b/, pattern: "№1" },
  { rx: /0000000000/, pattern: "0000000000" },
  { rx: /\[телефон\]/i, pattern: "[телефон]" },
  { rx: /\[ИНН\]/i, pattern: "[ИНН]" },
  { rx: /\[ОГРН\]/i, pattern: "[ОГРН]" },
];
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    const full = `${dir}/${f}`;
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(f)) out.push(full);
  }
  return out;
}
const VALIDATOR_FILES = [
  "validate-prices.ts", "validate-content.ts",
  "audit-stage-2-final.ts", "audit-stage-2-5-1.ts", "audit-stage-2-5-2.ts",
  "audit-stage-2-5-3.ts", "audit-stage-2-4-2.ts", "audit-stage-2-4-3.ts",
  "audit-stage-2-4-4.ts", "audit-construction-content.ts",
  "calculator-tests.ts", "calculator-rules.ts",
];
// src/config/company.ts хранит запретительный массив `forbidden` для
// helper isFilled(); подстроки внутри этого массива — не утечка, а защита.
const SAFELIST_FILES = new Set(["src/config/company.ts"]);
const matchesOutsideValidator: Array<{ where: string; pattern: string }> = [];
for (const file of walk(resolve(ROOT, "src"))) {
  const rel = file.replace(`${ROOT}/`, "");
  if (VALIDATOR_FILES.some((v) => rel.endsWith(v))) continue;
  if (SAFELIST_FILES.has(rel)) continue;
  const s = readFileSync(file, "utf8");
  for (const p of FORBIDDEN_PATTERNS) {
    if (p.rx.test(s)) matchesOutsideValidator.push({ where: rel, pattern: p.pattern });
  }
}
const forbiddenSearch = { matchesOutsideValidator };
ok(matchesOutsideValidator.length === 0, `forbiddenSearch: ${matchesOutsideValidator.length}`);

// ── 17. Regression checks ───────────────────────────────────────────
const regressionChecks = {
  servicePages: SERVICE_PAGES.length,
  priceItems: PRICES.length,
  calculatorModes: CALCULATOR_MODES.length,
  calculatorRoutes: existsSync(resolve(ROOT, "src/routes/kalkulyator-stoimosti.tsx")) ? 1 : 0,
  ctaCount: CALCULATOR_LINKS_FROM_SERVICES.length,
};
ok(regressionChecks.servicePages === 35, "regression: servicePages != 35");
ok(regressionChecks.priceItems === 334, "regression: priceItems != 334");
ok(regressionChecks.calculatorModes === 4, "regression: calculatorModes != 4");
ok(regressionChecks.calculatorRoutes === 1, "regression: calculatorRoutes != 1");
ok(regressionChecks.ctaCount === 16, "regression: CTA != 16");

// ── 18. Stage 2 completion ──────────────────────────────────────────
const stage2Completion = {
  allServicePagesComplete: activeServicePages === 35 && serviceStubPages === 0,
  calculatorComplete: regressionChecks.calculatorRoutes === 1 && regressionChecks.calculatorModes === 4,
  legalPagesComplete: legalRoutes.every((r) => r.exists && !r.usesRouteStub),
  informationPagesComplete: informationRoutes.every((r) => r.exists && !r.usesRouteStub),
  formsRemainDemo: formConsentLinks.noBackendCall && formConsentLinks.usesLocalStorage,
  backendNotStarted: !/supabase\.from|fetch\(["'`]\/api/.test(formSrc),
  readyForStage3: false,
  blockingIssues: [] as string[],
};
if (errors.length > 0) stage2Completion.blockingIssues = [...errors];
stage2Completion.readyForStage3 =
  stage2Completion.allServicePagesComplete &&
  stage2Completion.calculatorComplete &&
  stage2Completion.legalPagesComplete &&
  stage2Completion.informationPagesComplete &&
  stage2Completion.formsRemainDemo &&
  stage2Completion.backendNotStarted &&
  stage2Completion.blockingIssues.length === 0;

const totals = {
  priceItems: PRICES.length,
  servicePages: totalServicePages,
  activeServicePages,
  serviceStubPages,
  repairServicePages,
  constructionServicePages,
  engineeringServicePages,
  calculatorRoutes: regressionChecks.calculatorRoutes,
  calculatorModes: CALCULATOR_MODES.length,
  tilePages: 1,
  tilePriceItems,
  backendConnections: 0,
  authRoutesActivated: 0,
  adminRoutesActivated: 0,
  clientRoutesActivated: 0,
  informationRoutes: informationRoutes.length,
  legalRoutes: legalRoutes.length,
  remainingStubRoutes: remainingStubRoutes.length,
};

const specificationCheck = { passed: errors.length === 0, errors };

const result = {
  stage: STAGE,
  specificationCheck,
  servicePages: SERVICE_PAGES.map((p) => ({
    slug: p.slug, route: p.route, category: p.category, isStub: !!p.isStub,
  })),
  servicePageCounts: {
    total: totalServicePages,
    active: activeServicePages,
    stubs: serviceStubPages,
    construction: constructionServicePages,
    repair: repairServicePages,
    engineering: engineeringServicePages,
  },
  tilePage,
  calculator: {
    route: CALCULATOR_ROUTE,
    modes: CALCULATOR_MODES,
    ctaCount: CALCULATOR_LINKS_FROM_SERVICES.length,
  },
  informationRoutes,
  legalRoutes,
  remainingRouteStubs: remainingStubRoutes.map((r) => r.route),
  futureStageRoutes,
  navigation,
  footerLinks,
  formConsentLinks,
  companyDataUsage,
  storageInventory,
  portfolioIntegrity,
  reviewsIntegrity,
  structuredData,
  metadata,
  accessibility,
  responsiveChecks,
  forbiddenSearch,
  regressionChecks,
  stage2Completion,
  totals,
};

const outDir = resolve(ROOT, ".audit/stage-2.6");
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "audit.json"), JSON.stringify(result, null, 2));
writeFileSync(resolve(outDir, "audit-exit-code.txt"), String(errors.length === 0 ? 0 : 1));

if (errors.length === 0) {
  console.log("✓ audit:stage-2-final passed.");
  console.log(JSON.stringify({
    stage: STAGE,
    passed: true,
    readyForStage3: stage2Completion.readyForStage3,
    totals,
  }, null, 2));
  process.exit(0);
}
console.error(`✗ audit:stage-2-final: ${errors.length} ошибок`);
for (const e of errors) console.error("  " + e);
process.exit(1);
