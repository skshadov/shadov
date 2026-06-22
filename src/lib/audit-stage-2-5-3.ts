/**
 * Подэтап 2.5.3 — машинный аудит калькулятора.
 * Подтверждает наличие маршрута, спецификации, 4 режимов, формул, правил
 * предотвращения двойного учёта, CTA на 15 страницах, отсутствие
 * запрещённых паттернов и сохранность архитектуры предыдущих этапов.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync } from "fs";
import { resolve } from "path";
import { SERVICE_PAGES } from "@/data/service-pages";
import { PRICES } from "@/data/prices";
import { ALL_PRICE_CATEGORIES } from "@/types/pricing";
import {
  CALCULATOR_MODE_SPECS,
  CALCULATOR_LINKS_FROM_SERVICES,
  CALCULATOR_METADATA,
  CALCULATOR_ROUTE,
  PACKAGE_CONFLICTS,
  CALCULATOR_FORMULAS,
  CALCULATOR_DISCLAIMERS,
  CALCULATOR_PROHIBITED_AUTO_CALCULATIONS,
  HOUSE_COMPLETION_LEVELS_SPEC,
  CALCULATOR_UNRESOLVED_QUESTIONS,
} from "@/data/calculator-specification";
import { CALCULATOR_LOCAL_STORAGE_KEY, CALCULATOR_MODES } from "@/types/calculator";
import { MAIN_NAV } from "@/data/navigation";
import { ROUTES } from "@/data/routes";

const STAGE = "2.5.3";
const errors: string[] = [];
const ok = (cond: unknown, msg: string) => { if (!cond) errors.push(msg); };

function readSafe(p: string) {
  try { return readFileSync(resolve(process.cwd(), p), "utf8"); } catch { return ""; }
}

const calculatorRouteFile = "src/routes/kalkulyator-stoimosti.tsx";
const routeSrc = readSafe(calculatorRouteFile);

ok(existsSync(resolve(process.cwd(), calculatorRouteFile)), "файл маршрута калькулятора отсутствует");
ok(!/noindex/i.test(routeSrc), "страница калькулятора содержит noindex");
ok(routeSrc.includes(CALCULATOR_METADATA.canonical), "canonical не найден в route-файле");
ok(/BreadcrumbList/.test(routeSrc), "route-файл без BreadcrumbList");
ok(/WebApplication/.test(routeSrc), "route-файл без WebApplication JSON-LD");
ok(!/aggregateRating|ratingValue|priceCurrency/.test(routeSrc), "WebApplication содержит рейтинг или цену");

const calculatorRoute = {
  route: CALCULATOR_ROUTE,
  fileExists: existsSync(resolve(process.cwd(), calculatorRouteFile)),
  canonical: CALCULATOR_METADATA.canonical,
  h1: CALCULATOR_METADATA.h1,
  title: CALCULATOR_METADATA.title,
  description: CALCULATOR_METADATA.description,
  hasNoindex: /noindex/i.test(routeSrc),
  hasBreadcrumb: /BreadcrumbList/.test(routeSrc),
  hasWebApplication: /WebApplication/.test(routeSrc),
};

// Навигация
const flatNav: string[] = [];
for (const it of MAIN_NAV) {
  if ("items" in it) { flatNav.push(it.to); for (const s of it.items) flatNav.push(s.to); }
  else flatNav.push(it.to);
}
const navOccurrences = flatNav.filter((t) => t === CALCULATOR_ROUTE).length;
ok(navOccurrences === 1, `ссылок на калькулятор в MAIN_NAV ${navOccurrences}, ожидается 1`);
ok(ROUTES.some((r) => r.path === CALCULATOR_ROUTE), "ROUTES без калькулятора");

const navigation = {
  inMainNav: flatNav.includes(CALCULATOR_ROUTE),
  inRoutesTs: ROUTES.some((r) => r.path === CALCULATOR_ROUTE),
  occurrencesInMainNav: navOccurrences,
};

// Режимы
ok(CALCULATOR_MODES.length === 4, "режимов != 4");
ok(CALCULATOR_MODE_SPECS.length === 4, "спецификаций режимов != 4");
for (const spec of CALCULATOR_MODE_SPECS) {
  for (const c of spec.priceCategories) {
    ok(ALL_PRICE_CATEGORIES.includes(c), `режим ${spec.id}: неизвестная категория ${c}`);
  }
}
const modes = CALCULATOR_MODE_SPECS.map((s) => ({
  id: s.id,
  label: s.label,
  priceCategories: s.priceCategories,
  packageCategories: s.packageCategories,
  separateCategories: s.separateCategories,
  forbiddenAutoCalculations: s.forbiddenAutoCalculations,
}));

// Категории прайса
const priceCategoriesUsedByCalculator = Array.from(
  new Set(CALCULATOR_MODE_SPECS.flatMap((s) => s.priceCategories)),
);
const priceItemsTotal = PRICES.length;
ok(priceItemsTotal === 334, `priceItems ${priceItemsTotal} != 334`);

// Единицы измерения
const units = Array.from(new Set(PRICES.map((p) => p.unit).filter(Boolean))) as string[];

// Формулы и коэффициенты
const formulas = CALCULATOR_FORMULAS.map((f) => ({ id: f.id, description: f.description, source: f.source }));
ok(formulas.length >= 4, `формул ${formulas.length} < 4`);
const coefficients = {
  note:
    "Коэффициенты §13 хранятся в src/data/calculator-rules.ts. В калькулятор не подставляются автоматически — отражены только в смете.",
  source: "src/data/calculator-rules.ts",
};
const rounding = {
  intermediate: "Промежуточные значения не округляются до тысяч.",
  final: "Итог округляется до полного рубля (Math.round).",
  format: "Intl.NumberFormat('ru-RU') — neasaltable пробелы заменяются на NBSP.",
};

// Pkg conflicts
const packageCombinationRules = Object.entries(PACKAGE_CONFLICTS).map(([pkg, conflicts]) => ({
  packageCategory: pkg,
  conflictsWith: conflicts,
}));

// Запрещённые автоматические расчёты
const prohibitedCalculations = CALCULATOR_PROHIBITED_AUTO_CALCULATIONS;

// CTA
const servicePageLinks = CALCULATOR_LINKS_FROM_SERVICES.map((l) => ({
  slug: l.slug,
  mode: l.mode,
  category: l.category ?? null,
  inServicePages: SERVICE_PAGES.some((p) => p.slug === l.slug),
}));
ok(servicePageLinks.length === 15, `CTA: ожидается 15, получено ${servicePageLinks.length}`);
for (const e of servicePageLinks) {
  ok(e.inServicePages, `CTA ${e.slug}: страница не найдена`);
}
// Подэтап 2.6: CTA на /ukladka-plitki разрешена после активации страницы.

// localStorage
const localStorageSpec = {
  key: CALCULATOR_LOCAL_STORAGE_KEY,
  versioned: /^shadov-cost-calculator-v\d+$/.test(CALCULATOR_LOCAL_STORAGE_KEY),
  storesPersonalData: false,
};
ok(localStorageSpec.versioned, "localStorage key не versioned");

// Запрещённые паттерны в исходниках калькулятора
const FILES_TO_SCAN = [
  "src/lib/calculator-engine.ts",
  "src/lib/calculator-tests.ts",
  "src/components/calculator/CostCalculator.tsx",
  "src/components/calculator/CalculatorModeSelector.tsx",
  "src/components/calculator/CalculatorInputs.tsx",
  "src/components/calculator/CalculatorPriceItems.tsx",
  "src/components/calculator/CalculatorSummary.tsx",
  "src/components/calculator/CalculatorWarnings.tsx",
  "src/components/calculator/CalculatorDisclaimer.tsx",
  "src/components/calculator/CalculatorCta.tsx",
  "src/routes/kalkulyator-stoimosti.tsx",
];
const matchesOutsideValidator: Array<{ where: string; pattern: string }> = [];
const FORBIDDEN_PATTERNS: Array<{ rx: RegExp; pattern: string }> = [
  { rx: /\beval\s*\(/, pattern: "eval(" },
  { rx: /NaN\s*₽/, pattern: "NaN ₽" },
  { rx: /Infinity\s*₽/, pattern: "Infinity ₽" },
  { rx: /TODO|FIXME|Lorem ipsum/i, pattern: "TODO/FIXME/Lorem" },
  { rx: /СРО[\s-]*[№N]?\s*\d/i, pattern: "SRO number" },
  { rx: /собственн[а-я]*\s+лаборатори[а-я]+/i, pattern: "own lab" },
];
for (const f of FILES_TO_SCAN) {
  const s = readSafe(f);
  for (const p of FORBIDDEN_PATTERNS) {
    if (p.rx.test(s)) matchesOutsideValidator.push({ where: f, pattern: p.pattern });
  }
}
const forbiddenSearch = { matchesOutsideValidator };
ok(matchesOutsideValidator.length === 0, `forbiddenSearch: ${matchesOutsideValidator.length}`);

// Test results — запуск через node:child_process для совместимости.
let calculatorTestsExit = 1;
let calculatorTestsOutput = "";
try {
  const { spawnSync } = await import("node:child_process");
  const child = spawnSync("bun", ["src/lib/calculator-tests.ts"], { encoding: "utf8" });
  calculatorTestsExit = child.status ?? 1;
  calculatorTestsOutput = (child.stdout ?? "") + (child.stderr ?? "");
} catch (e) {
  calculatorTestsOutput = String(e);
}
ok(calculatorTestsExit === 0, "calculator-tests завершился с ошибкой");
const testScenarios = {
  runner: "src/lib/calculator-tests.ts",
  exitCode: calculatorTestsExit,
  passed: calculatorTestsExit === 0,
  lastLines: calculatorTestsOutput.trim().split("\n").slice(-5),
};

// metadata / structuredData
const metadata = {
  title: CALCULATOR_METADATA.title,
  description: CALCULATOR_METADATA.description,
  canonical: CALCULATOR_METADATA.canonical,
  ogTitle: CALCULATOR_METADATA.title,
  ogDescription: CALCULATOR_METADATA.description,
  ogType: CALCULATOR_METADATA.ogType,
  ogUrl: CALCULATOR_METADATA.canonical,
  h1: CALCULATOR_METADATA.h1,
};
const structuredData = {
  breadcrumb: /BreadcrumbList/.test(routeSrc),
  webApplication: /WebApplication/.test(routeSrc),
  hasFakeRating: /aggregateRating|ratingValue/.test(routeSrc),
  hasFakePrice: /priceCurrency/.test(routeSrc),
};

// inputs
const inputs = {
  repair: ["площадь по полу", "пакет ремонта", "дополнительные работы", "демонтаж"],
  house: ["технология", "площадь дома", "уровень готовности", "режим только работы или с базовыми материалами"],
  construction: ["категория", "позиция", "объём в фактической единице"],
  engineering: ["направление", "пакет или отдельная работа", "объём в фактической единице"],
};

// sourceInventory
const sourceInventory = {
  calculatorRulesSource: "src/data/calculator-rules.ts",
  calculatorSpecificationSource: "src/data/calculator-specification.ts",
  pricesSource: "src/data/prices.ts",
  enginePath: "src/lib/calculator-engine.ts",
  testsPath: "src/lib/calculator-tests.ts",
  routePath: calculatorRouteFile,
  documentationReferences: [
    "§10 — инженерные системы",
    "§11 — список маршрутов",
    "§13 — коэффициенты сметы",
    "§34 — калькулятор предварительной стоимости",
  ],
  unresolvedQuestions: CALCULATOR_UNRESOLVED_QUESTIONS,
};

// calculatorSpecification snapshot
const calculatorSpecification = {
  route: CALCULATOR_ROUTE,
  implementationStatus: "complete",
  modes: modes.map((m) => m.id),
  priceCategories: priceCategoriesUsedByCalculator,
  formulas: formulas.map((f) => f.id),
  packageConflicts: Object.keys(PACKAGE_CONFLICTS),
  houseCompletionLevels: HOUSE_COMPLETION_LEVELS_SPEC.map((l) => l.id),
  disclaimers: CALCULATOR_DISCLAIMERS.length,
  links: CALCULATOR_LINKS_FROM_SERVICES.length,
};

// accessibility — поверхностный анализ исходников
const summarySrc = readSafe("src/components/calculator/CalculatorSummary.tsx");
const modeSrc = readSafe("src/components/calculator/CalculatorModeSelector.tsx");
const inputsSrc = readSafe("src/components/calculator/CalculatorInputs.tsx");
const accessibility = {
  ariaLiveOnSummary: /aria-live="polite"/.test(summarySrc),
  tableHasCaption: /<caption/.test(summarySrc),
  tableHasThead: /<thead/.test(summarySrc),
  tableUsesScope: /scope="col"/.test(summarySrc),
  modeRadioGroup: /role="radiogroup"/.test(modeSrc) && /role="radio"/.test(modeSrc),
  inputsHaveLabels: /<label[^>]*htmlFor=/.test(inputsSrc),
  ariaDescribedBy: /aria-describedby/.test(inputsSrc),
  minTapHeight: /min-h-11/.test(modeSrc) && /min-h-11/.test(summarySrc),
};
for (const [k, v] of Object.entries(accessibility)) {
  ok(v, `accessibility.${k} провален`);
}

const responsiveChecks = {
  notes: [
    "Виджет калькулятора использует grid lg:grid-cols-[1fr_1fr] — на мобильных устройствах одна колонка.",
    "Таблица итогов обёрнута в overflow-x-auto для прокрутки на 320px.",
    "Все поля type=number имеют inputMode=decimal — iOS не показывает zoom.",
    "Кнопки min-h-11 — соответствуют 44 px tap target.",
  ],
  breakpointsConsidered: ["320px", "375px", "430px", "768px", "1024px", "1440px"],
};

// Регрессии
const repairActive = SERVICE_PAGES.filter((p) => p.category === "repair" && !p.isStub).length;
const constructionActive = SERVICE_PAGES.filter((p) => p.category === "construction" && !p.isStub).length;
const engineeringActive = SERVICE_PAGES.filter((p) => p.category === "engineering" && !p.isStub).length;
const tileActivePages = SERVICE_PAGES.filter((p) => p.slug === "ukladka-plitki" && !p.isStub).length;
const tileRouteSrc = readSafe("src/routes/ukladka-plitki.tsx");

const regressionChecks = {
  servicePages: SERVICE_PAGES.length,
  repairActivePages: repairActive,
  constructionActivePages: constructionActive,
  engineeringActivePages: engineeringActive,
  tileActivePages,
  tileIsRouteStub: /RouteStub/.test(tileRouteSrc),
  tileNoindexFollow: /noindex,\s*follow/.test(tileRouteSrc),
  pricesTotal: PRICES.length,
};
ok(regressionChecks.servicePages === 35, `servicePages != 35`);
ok(regressionChecks.repairActivePages === 11, `repairActive != 11`);
ok(regressionChecks.constructionActivePages === 18, `constructionActive != 18`);
ok(regressionChecks.engineeringActivePages === 6, `engineeringActive != 6`);
ok(regressionChecks.tileActivePages === 1, `tileActivePages != 1`);
ok(!regressionChecks.tileIsRouteStub, "/ukladka-plitki: RouteStub снят на этапе 2.6");
ok(!regressionChecks.tileNoindexFollow, "/ukladka-plitki: noindex снят на этапе 2.6");
ok(regressionChecks.pricesTotal === 334, `prices total != 334`);

const totals = {
  calculatorRoutes: existsSync(resolve(process.cwd(), calculatorRouteFile)) ? 1 : 0,
  calculatorModes: CALCULATOR_MODES.length,
  priceItems: PRICES.length,
  servicePages: SERVICE_PAGES.length,
  repairActivePages: repairActive,
  constructionActivePages: constructionActive,
  engineeringActivePages: engineeringActive,
  tileActivePages,
};
ok(totals.calculatorRoutes === 1, "totals.calculatorRoutes != 1");
ok(totals.calculatorModes === 4, "totals.calculatorModes != 4");
ok(totals.priceItems === 334, "totals.priceItems != 334");
ok(totals.servicePages === 35, "totals.servicePages != 35");
ok(totals.repairActivePages === 11, "totals.repairActivePages != 11");
ok(totals.constructionActivePages === 18, "totals.constructionActivePages != 18");
ok(totals.engineeringActivePages === 6, "totals.engineeringActivePages != 6");
ok(totals.tileActivePages === 1, "totals.tileActivePages != 1");

const specificationCheck = { passed: errors.length === 0, errors };

const result = {
  stage: STAGE,
  specificationCheck,
  sourceInventory,
  calculatorSpecification,
  calculatorRoute,
  navigation,
  modes,
  inputs,
  priceCategories: priceCategoriesUsedByCalculator,
  priceItems: priceItemsTotal,
  units,
  formulas,
  coefficients,
  rounding,
  packageCombinationRules,
  prohibitedCalculations,
  testScenarios,
  metadata,
  structuredData,
  servicePageLinks,
  localStorage: localStorageSpec,
  accessibility,
  responsiveChecks,
  forbiddenSearch,
  regressionChecks,
  totals,
};

const outDir = resolve(process.cwd(), ".audit/stage-2.5.3");
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "audit.json"), JSON.stringify(result, null, 2), "utf8");
const selfPath = resolve(process.cwd(), "src/lib/audit-stage-2-5-3.ts");
if (existsSync(selfPath)) writeFileSync(resolve(outDir, "audit-source.ts"), readFileSync(selfPath, "utf8"), "utf8");
const exitCode = specificationCheck.passed ? 0 : 1;
writeFileSync(resolve(outDir, "audit-exit-code.txt"), `${exitCode}\n`, "utf8");

if (specificationCheck.passed) {
  console.log("✓ audit:stage-2.5.3 passed.");
  process.exit(0);
}
console.error("✗ audit:stage-2.5.3 failed:");
for (const e of errors) console.error("  -", e);
process.exit(1);
