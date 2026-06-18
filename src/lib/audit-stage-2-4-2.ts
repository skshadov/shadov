/**
 * Подэтап 2.4.2C — единый машинный аудит этапа 2.4.2.
 * Сравнивает фактические данные проекта с ожидаемыми значениями ТЗ
 * и формирует единый JSON-отчёт. Ручной пересказ не используется.
 */
import { readFileSync, readdirSync } from "fs";
import { resolve, join } from "path";
import {
  HOUSE_COMPLETION_DISCLAIMER,
  HOUSE_COMPLETION_LEVELS,
  HOUSE_TECHNOLOGIES,
  HOUSE_TURNKEY_WITH_BASIC_MATERIALS_LABEL,
} from "@/data/house-technologies";
import { CONSTRUCTION_SERVICE_PAGES } from "@/data/service-pages-construction";
import { resolveServicePage } from "@/lib/get-service-data";
import { getPriceById } from "@/data/prices";

const ACTIVE_ROUTES = [
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

const STUB_ROUTES: readonly string[] = [];

const EXPECTED_TURNKEY_H1 =
  "Строительство частных домов под ключ в Москве и Московской области";

const EXPECTED_TURNKEY_INCLUDED = [
  "Конструктив",
  "Фасад",
  "Кровля",
  "Окна",
  "Наружные двери",
  "Электрика",
  "Сантехника",
  "Отопление",
  "Водоснабжение",
  "Канализация",
  "Черновая отделка",
  "Чистовая отделка базового уровня",
  "Сантехнические приборы базовой комплектации",
  "Розетки и выключатели базовой комплектации",
  "Проверка инженерных систем",
  "Сдача готового дома",
];

const EXPECTED_TURNKEY_EXCLUDED = [
  "Мебель рассчитывается отдельно",
  "Кухня рассчитывается отдельно",
  "Бытовая техника рассчитывается отдельно",
  "Благоустройство рассчитывается отдельно",
  "Дорогостоящее оборудование рассчитывается отдельно",
];

const EXPECTED_MATRIX_LABELS = {
  shell: "Коробка",
  warmShell: "Тёплый контур",
  preFinish: "Под чистовую отделку",
  turnkey: "Под ключ",
  materials: "Под ключ с базовыми материалами",
};

const EXPECTED_PRICES: Record<string, [number, number, number, number, number]> = {
  "karkasnye-doma": [18000, 26000, 36000, 45000, 95000],
  "doma-iz-sip-paneley": [17000, 25000, 35000, 44000, 90000],
  "doma-iz-brusa": [20000, 28000, 38000, 48000, 105000],
  "doma-iz-kleenogo-brusa": [24000, 34000, 46000, 58000, 125000],
  "doma-iz-gazobetona": [25000, 36000, 50000, 65000, 125000],
  "doma-iz-keramicheskih-blokov": [28000, 40000, 55000, 72000, 145000],
  "kirpichnye-doma": [32000, 45000, 62000, 80000, 165000],
  "monolitnye-doma": [35000, 50000, 70000, 90000, 180000],
  "kombinirovannye-doma": [40000, 55000, 75000, 95000, 190000],
};

const EXPECTED_TECHNOLOGY_NAMES = [
  "Каркасный дом",
  "Дом из СИП-панелей",
  "Дом из профилированного бруса",
  "Дом из клееного бруса",
  "Дом из газобетона",
  "Дом из керамических блоков",
  "Кирпичный дом",
  "Монолитный железобетонный дом",
  "Комбинированный дом",
];

const ALLOWED_ILLUSTRATION_KEYS = new Set([
  "direction-houses",
  "hero-construction",
  "direction-monolith",
]);

const FORBIDDEN_PATTERNS = [
  "Строительство новых домов под ключ",
  "Строительство первых домов под ключом",
  "Сантехнические приборы станции комплектации",
  "Сантехнические приборы определения комплектации",
  "Сантехнические приборы для комплектации",
  "Розетки и выключатели местоположения комплектации",
  "Розетки и выключатели аварийной комплектации",
  "Розетки и выключатели формирования комплектации",
  "Черная отделка",
  "Кровя",
  "Электроика",
  "кавалер",
  "ставка тарификация",
  "Предполагается отдельно",
  "Дыхающий",
  "Под дверью",
  "Чайный дом",
];

// Файлы валидатора, где запрещённые строки разрешены (как список запретов).
const VALIDATOR_ALLOWLIST = new Set([
  "src/lib/validate-content.ts",
  "src/lib/audit-stage-2-4-2.ts",
]);

const SEARCH_ROOTS = ["src/data", "src/components", "src/routes"];

function readRouteSrc(route: string): string {
  return readFileSync(resolve(process.cwd(), `src/routes${route}.tsx`), "utf8");
}

function findCanonical(src: string): string {
  if (!/rel:\s*"canonical"/.test(src)) return "";
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
        if (lines[i].includes(phrase)) {
          matches.push(`${file}:${i + 1}: ${phrase}`);
        }
      }
    }
  }
  return matches;
}

function eq(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const errors: string[] = [];
const warnings: string[] = [];

// ── routes.active ──────────────────────────────────────────────────────
const activeRoutes = ACTIVE_ROUTES.map((route) => {
  const src = readRouteSrc(route);
  const slug = route.replace(/^\//, "");
  const page = CONSTRUCTION_SERVICE_PAGES.find((p) => p.route === route);
  if (!page) errors.push(`route ${route}: страница не найдена в CONSTRUCTION_SERVICE_PAGES`);
  const usesConstructionServicePage = /ConstructionServicePage/.test(src);
  const hasRouteStub = /RouteStub/.test(src);
  const hasNoindex = /noindex/i.test(src);
  if (!usesConstructionServicePage)
    errors.push(`route ${route}: не подключён ConstructionServicePage`);
  if (hasRouteStub) errors.push(`route ${route}: всё ещё RouteStub`);
  if (hasNoindex) errors.push(`route ${route}: содержит noindex`);
  return {
    route,
    slug,
    h1: page?.h1 ?? "",
    metaTitle: page?.metaTitle ?? "",
    canonical: findCanonical(src),
    illustrationKey: page?.illustrationKey ?? null,
    usesConstructionServicePage,
    hasRouteStub,
    hasNoindex,
  };
});

const turnkeyPage = activeRoutes.find((r) => r.route === "/stroitelstvo-domov-pod-klyuch");
if (turnkeyPage && turnkeyPage.h1 !== EXPECTED_TURNKEY_H1) {
  errors.push(
    `H1 /stroitelstvo-domov-pod-klyuch не совпадает.\n  ожидается: ${EXPECTED_TURNKEY_H1}\n  найдено:   ${turnkeyPage.h1}`,
  );
}

// ── routes.stubs ───────────────────────────────────────────────────────
const stubRoutes = STUB_ROUTES.map((route) => {
  const src = readRouteSrc(route);
  const usesConstructionServicePage = /ConstructionServicePage/.test(src);
  const hasRouteStub = /RouteStub/.test(src);
  const hasNoindexFollow = /noindex,\s*follow/.test(src);
  if (!hasRouteStub) errors.push(`stub ${route}: должен оставаться RouteStub`);
  if (!hasNoindexFollow) errors.push(`stub ${route}: должен сохранять noindex, follow`);
  if (usesConstructionServicePage)
    errors.push(`stub ${route}: не должен подключать ConstructionServicePage`);
  return { route, usesConstructionServicePage, hasRouteStub, hasNoindexFollow };
});

// ── technologies ───────────────────────────────────────────────────────
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

if (!eq(HOUSE_TECHNOLOGIES.map((t) => t.name), EXPECTED_TECHNOLOGY_NAMES)) {
  errors.push(
    `Названия девяти технологий не совпадают.\n  ожидается: ${JSON.stringify(EXPECTED_TECHNOLOGY_NAMES)}\n  найдено:   ${JSON.stringify(HOUSE_TECHNOLOGIES.map((t) => t.name))}`,
  );
}

let comparedPrices = 0;
for (const t of HOUSE_TECHNOLOGIES) {
  const expected = EXPECTED_PRICES[t.slug];
  if (!expected) {
    errors.push(`Технология ${t.slug}: нет ожидаемых цен`);
    continue;
  }
  const actual: [number, number, number, number, number] = [
    t.workPrices.shell,
    t.workPrices.warmShell,
    t.workPrices.preFinish,
    t.workPrices.turnkey,
    t.turnkeyWithBasicMaterials,
  ];
  for (let i = 0; i < 5; i++) {
    comparedPrices++;
    if (actual[i] !== expected[i]) {
      errors.push(`Цена ${t.slug}[${i}]: ожидается ${expected[i]}, найдено ${actual[i]}`);
    }
  }
  // Сверка с prices.ts.
  const pairs: Array<[string, number]> = [
    [`house_construction_work-${t.slug}-shell`, t.workPrices.shell],
    [`house_construction_work-${t.slug}-warm`, t.workPrices.warmShell],
    [`house_construction_work-${t.slug}-prefinish`, t.workPrices.preFinish],
    [`house_construction_work-${t.slug}-turnkey`, t.workPrices.turnkey],
    [`house_construction_materials-${t.slug}-turnkey-materials`, t.turnkeyWithBasicMaterials],
  ];
  for (const [id, expectedPrice] of pairs) {
    const item = getPriceById(id);
    if (!item) errors.push(`prices.ts: отсутствует ${id}`);
    else if (item.priceFrom !== expectedPrice)
      errors.push(`prices.ts ${id}: ${item.priceFrom} ≠ ${expectedPrice}`);
  }
}

// ── matrixLabels ───────────────────────────────────────────────────────
const matrixLabels = {
  shell: HOUSE_COMPLETION_LEVELS[0].name,
  warmShell: HOUSE_COMPLETION_LEVELS[1].name,
  preFinish: HOUSE_COMPLETION_LEVELS[2].name,
  turnkey: HOUSE_COMPLETION_LEVELS[3].name,
  materials: HOUSE_TURNKEY_WITH_BASIC_MATERIALS_LABEL,
};
if (!eq(matrixLabels, EXPECTED_MATRIX_LABELS)) {
  errors.push(
    `Заголовки матрицы не совпадают.\n  ожидается: ${JSON.stringify(EXPECTED_MATRIX_LABELS)}\n  найдено:   ${JSON.stringify(matrixLabels)}`,
  );
}

// ── completionLevels ───────────────────────────────────────────────────
const completionLevels = HOUSE_COMPLETION_LEVELS.map(({ id, name, included, excluded }) => ({
  id,
  name,
  included,
  excluded,
}));
const turnkey = HOUSE_COMPLETION_LEVELS.find((l) => l.id === "turnkey");
if (!turnkey) errors.push("отсутствует уровень turnkey");
else {
  if (!eq(turnkey.included, EXPECTED_TURNKEY_INCLUDED)) {
    errors.push(
      `included «Под ключ» не совпадает.\n  ожидается: ${JSON.stringify(EXPECTED_TURNKEY_INCLUDED)}\n  найдено:   ${JSON.stringify(turnkey.included)}`,
    );
  }
  if (!eq(turnkey.excluded, EXPECTED_TURNKEY_EXCLUDED)) {
    errors.push(
      `excluded «Под ключ» не совпадает.\n  ожидается: ${JSON.stringify(EXPECTED_TURNKEY_EXCLUDED)}\n  найдено:   ${JSON.stringify(turnkey.excluded)}`,
    );
  }
}

const completionDisclaimer = HOUSE_COMPLETION_DISCLAIMER;

// ── relatedServices ────────────────────────────────────────────────────
const ACTIVE_SLUG_SET = new Set(ACTIVE_ROUTES.map((r) => r.replace(/^\//, "")));
const relatedServices = ACTIVE_ROUTES.map((route) => {
  const slug = route.replace(/^\//, "");
  const resolved = resolveServicePage(slug);
  const displayedRelatedRoutes = resolved ? resolved.related.map((r) => r.route) : [];
  for (const r of displayedRelatedRoutes) {
    const rSlug = r.replace(/^\//, "");
    if (!ACTIVE_SLUG_SET.has(rSlug)) {
      errors.push(`related ${route}: содержит неактивный маршрут ${r}`);
    }
  }
  return { route, displayedRelatedRoutes };
});

// ── accessibility ──────────────────────────────────────────────────────
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
if (!accessibility.usesAriaPressed) errors.push("HouseTechnologyMatrix: aria-pressed отсутствует");
if (accessibility.containsRadioRole) errors.push("HouseTechnologyMatrix: запрещён role=\"radio\"");
if (accessibility.containsRadioGroupRole)
  errors.push("HouseTechnologyMatrix: запрещён role=\"radiogroup\"");
if (!accessibility.containsMinHeight44) errors.push("HouseTechnologyMatrix: нет min-h-11");
if (!accessibility.containsMinWidth44) errors.push("HouseTechnologyMatrix: нет min-w-11");

// ── illustrations ──────────────────────────────────────────────────────
const illustrations = activeRoutes.map((r) => ({
  route: r.route,
  illustrationKey: r.illustrationKey,
  allowedKey: r.illustrationKey ? ALLOWED_ILLUSTRATION_KEYS.has(r.illustrationKey) : false,
}));
for (const it of illustrations) {
  if (!it.allowedKey) errors.push(`route ${it.route}: недопустимый illustrationKey=${it.illustrationKey}`);
}

// ── forbidden search ───────────────────────────────────────────────────
const matchesOutsideValidator = searchForbidden();
if (matchesOutsideValidator.length > 0) {
  for (const m of matchesOutsideValidator) errors.push(`forbidden: ${m}`);
}

// ── totals ─────────────────────────────────────────────────────────────
const totals = {
  activeRoutes: activeRoutes.length,
  stubRoutes: stubRoutes.length,
  technologies: technologies.length,
  comparedPrices,
};
if (totals.activeRoutes !== 18) errors.push(`activeRoutes ≠ 18 (${totals.activeRoutes})`);
if (totals.stubRoutes !== 0) errors.push(`stubRoutes ≠ 0 (${totals.stubRoutes})`);
if (totals.technologies !== 9) errors.push(`technologies ≠ 9 (${totals.technologies})`);
if (totals.comparedPrices !== 45) errors.push(`comparedPrices ≠ 45 (${totals.comparedPrices})`);

const report = {
  stage: "2.4.2",
  specificationCheck: {
    passed: errors.length === 0,
    errors,
    warnings,
  },
  routes: {
    active: activeRoutes,
    stubs: stubRoutes,
  },
  technologies,
  matrixLabels,
  completionLevels,
  completionDisclaimer,
  relatedServices,
  accessibility,
  illustrations,
  forbiddenSearch: {
    patterns: FORBIDDEN_PATTERNS,
    matchesOutsideValidator,
  },
  totals,
};

console.log(JSON.stringify(report, null, 2));
process.exit(errors.length === 0 ? 0 : 1);