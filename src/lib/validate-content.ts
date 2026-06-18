/**
 * Подэтап 2.3A — валидация наполнения страниц ремонта.
 * Проверки выполняются только над данными ремонта (десять маршрутов 2.3).
 */
import { SERVICE_PAGES } from "@/data/service-pages";
import { REPAIR_PACKAGES } from "@/data/repair-packages";
import { ALL_PRICE_CATEGORIES } from "@/types/pricing";
import { SERVICE_FAQ } from "@/data/service-faq";
import { PRICES, getPriceById } from "@/data/prices";
import { readFileSync } from "fs";
import { resolve } from "path";

const REQUIRED_REPAIR_ROUTES = [
  "/remont",
  "/remont-pod-klyuch",
  "/kosmeticheskiy-remont",
  "/ekonom-remont",
  "/standartnyy-remont",
  "/evroremont",
  "/biznes-remont",
  "/premialnyy-remont",
  "/chernovoy-remont",
  "/chistovaya-otdelka",
] as const;

// Утверждённые H1 (дословно).
const EXPECTED_H1: Record<string, string> = {
  "/remont": "Ремонт квартир и частных домов в Москве и Московской области",
  "/remont-pod-klyuch":
    "Комплексный ремонт квартиры или дома с единым ответственным подрядчиком",
  "/kosmeticheskiy-remont": "Косметический ремонт квартиры или помещения",
  "/ekonom-remont": "Эконом-ремонт квартиры или помещения",
  "/standartnyy-remont": "Стандартный ремонт квартиры или дома",
  "/evroremont": "Евроремонт квартиры или дома уровня комфорт",
  "/biznes-remont": "Ремонт квартиры или дома бизнес-класса",
  "/premialnyy-remont": "Премиальный ремонт квартиры или частного дома",
  "/chernovoy-remont": "Черновой ремонт квартиры или частного дома",
  "/chistovaya-otdelka": "Чистовая отделка квартиры или частного дома",
};

// Утверждённые стартовые цены (без пробелов, только число) — сверяем подстрокой.
const EXPECTED_STARTING_PRICE_NUMBER: Record<string, string> = {
  "/remont": "6 500",
  "/remont-pod-klyuch": "12 000",
  "/kosmeticheskiy-remont": "6 500",
  "/ekonom-remont": "12 000",
  "/standartnyy-remont": "18 000",
  "/evroremont": "25 000",
  "/biznes-remont": "35 000",
  "/premialnyy-remont": "48 000",
  "/chernovoy-remont": "10 000",
  "/chistovaya-otdelka": "8 000",
};

// Утверждённое количество included для пакетов с фиксированным составом.
const EXPECTED_INCLUDED_COUNT: Record<string, number> = {
  cosmetic: 10,
  econom: 10,
  standard: 15,
  euro: 13,
  business: 13,
  premium: 14,
};
const EXPECTED_EXCLUDED_COUNT: Record<string, number> = {
  cosmetic: 7,
};

const FORBIDDEN = [
  /\blorem ipsum\b/i,
  /\bTODO\b/,
  /\bFIXME\b/,
  /Косадный/,
  /Ирландия/,
];
const WARRANTY_TERM_RX = /гаранти[а-я]+\s+\d+\s*(год|года|лет|мес)/i;

function fail(msg: string): never {
  console.error("validate-content:", msg);
  process.exit(1);
}
function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
function normalizeSpaces(s: string): string {
  return s.replace(/\u00A0/g, " ");
}

const repairPages = SERVICE_PAGES.filter((p) => p.category === "repair");
const repairRoutes = repairPages.map((p) => p.route);

console.log("validate-content: страниц ремонта", repairPages.length);

if (repairPages.length !== REQUIRED_REPAIR_ROUTES.length) {
  fail(
    `ожидается ${REQUIRED_REPAIR_ROUTES.length} страниц ремонта, найдено ${repairPages.length}`,
  );
}
for (const r of REQUIRED_REPAIR_ROUTES) {
  if (!repairRoutes.includes(r)) fail(`отсутствует маршрут ${r}`);
}
if (repairRoutes.includes("/eksklyuzivnyy-remont" as never)) {
  fail("обнаружен запрещённый маршрут /eksklyuzivnyy-remont");
}

const slugSet = new Set<string>();
const routeSet = new Set<string>();
const h1Set = new Set<string>();
const metaTitleSet = new Set<string>();

for (const p of repairPages) {
  if (slugSet.has(p.slug)) fail(`дублированный slug: ${p.slug}`);
  if (routeSet.has(p.route)) fail(`дублированный route: ${p.route}`);
  if (h1Set.has(p.h1)) fail(`дублированный H1: ${p.h1}`);
  if (metaTitleSet.has(p.metaTitle)) fail(`дублированный metaTitle: ${p.metaTitle}`);
  slugSet.add(p.slug);
  routeSet.add(p.route);
  h1Set.add(p.h1);
  metaTitleSet.add(p.metaTitle);

  // Точное совпадение H1.
  const expectedH1 = EXPECTED_H1[p.route];
  if (!expectedH1) fail(`страница ${p.route}: нет ожидаемого H1`);
  if (p.h1 !== expectedH1) {
    fail(
      `страница ${p.route}: H1 не совпадает с утверждённым.\n  ожидается: ${expectedH1}\n  найдено:   ${p.h1}`,
    );
  }

  // Стартовая цена должна содержать утверждённое число (с учётом NBSP).
  const expectedPriceNum = EXPECTED_STARTING_PRICE_NUMBER[p.route];
  if (!p.startingPrice) fail(`страница ${p.route}: отсутствует startingPrice`);
  const normalized = normalizeSpaces(p.startingPrice!);
  if (!normalized.includes(expectedPriceNum)) {
    fail(
      `страница ${p.route}: ожидается цена ${expectedPriceNum} ₽, найдено "${p.startingPrice}"`,
    );
  }

  // Запрет неверных стартовых цен для чернового и чистового ремонта.
  if (p.route === "/chernovoy-remont" && /4\s*500/.test(normalized)) {
    fail("страница /chernovoy-remont: запрещённая стартовая цена 4 500");
  }
  if (p.route === "/chistovaya-otdelka" && /3\s*500/.test(normalized)) {
    fail("страница /chistovaya-otdelka: запрещённая стартовая цена 3 500");
  }

  const required: Array<[keyof typeof p, string[]]> = [
    ["included", p.included],
    ["excluded", p.excluded],
    ["stages", p.stages],
    ["qualityControl", p.qualityControl],
    ["documents", p.documents],
    ["timelineFactors", p.timelineFactors],
  ];
  for (const [name, arr] of required) {
    if (!arr.length) fail(`страница ${p.slug}: поле ${String(name)} пустое`);
  }

  for (const c of p.priceCategoryIds) {
    if (!ALL_PRICE_CATEGORIES.includes(c)) fail(`страница ${p.slug}: неизвестная ценовая категория ${c}`);
  }
  for (const id of p.faqIds) {
    if (!SERVICE_FAQ.some((f) => f.id === id)) fail(`страница ${p.slug}: FAQ ${id} не найден`);
  }
  for (const s of p.relatedSlugs) {
    if (!SERVICE_PAGES.some((x) => x.slug === s)) {
      fail(`страница ${p.slug}: связанный slug ${s} не найден`);
    }
  }

  // Подэтап 2.3A — обязательный явный перечень позиций примера сметы.
  if (!p.estimateExampleItemIds || p.estimateExampleItemIds.length === 0) {
    fail(`страница ${p.slug}: отсутствует estimateExampleItemIds`);
  }
  if (p.estimateExampleItemIds.length < 4 || p.estimateExampleItemIds.length > 6) {
    fail(
      `страница ${p.slug}: estimateExampleItemIds должен содержать 4–6 строк, найдено ${p.estimateExampleItemIds.length}`,
    );
  }
  for (const id of p.estimateExampleItemIds) {
    const item = getPriceById(id);
    if (!item) fail(`страница ${p.slug}: позиция ${id} не найдена в prices.ts`);
    // Пример /remont не использует категорию repair_packages.
    if (p.slug === "remont" && item!.category === "repair_packages") {
      fail(`страница /remont: пример сметы не должен содержать категорию repair_packages (${id})`);
    }
  }

  // Проверка запрещённых строк в текстовых полях.
  const blob = JSON.stringify(p);
  for (const rx of FORBIDDEN) {
    if (rx.test(blob)) fail(`страница ${p.slug}: запрещённая строка ${rx}`);
  }
  if (WARRANTY_TERM_RX.test(blob)) {
    fail(`страница ${p.slug}: конкретный гарантийный срок недопустим на сайте`);
  }
}

// Семь пакетов ремонта с утверждёнными ценами и составом.
const EXPECTED_PRICES: Record<string, number> = {
  cosmetic: 6500,
  econom: 12000,
  standard: 18000,
  euro: 25000,
  business: 35000,
  premium: 48000,
  exclusive: 65000,
};
if (REPAIR_PACKAGES.length !== 7) fail(`ожидается 7 пакетов, найдено ${REPAIR_PACKAGES.length}`);
for (const id of Object.keys(EXPECTED_PRICES)) {
  const pkg = REPAIR_PACKAGES.find((p) => p.id === id);
  if (!pkg) fail(`отсутствует пакет ${id}`);
  if (pkg!.priceFrom !== EXPECTED_PRICES[id]) {
    fail(`пакет ${id}: ожидается ${EXPECTED_PRICES[id]}, найдено ${pkg!.priceFrom}`);
  }
  // Полное публичное название не должно быть сокращением до одного слова.
  if (!/ремонт/i.test(pkg!.name) && !/комфорт/i.test(pkg!.name)) {
    fail(`пакет ${id}: публичное название «${pkg!.name}» не является полным`);
  }
  for (const field of [
    "included",
    "excluded",
    "engineeringLevel",
    "surfacePreparation",
    "finishingSolutions",
    "priceFactors",
  ] as const) {
    if (!pkg![field].length) fail(`пакет ${id}: поле ${field} пустое`);
  }
  const expIncluded = EXPECTED_INCLUDED_COUNT[id];
  if (expIncluded !== undefined && pkg!.included.length !== expIncluded) {
    fail(
      `пакет ${id}: ожидается included = ${expIncluded}, найдено ${pkg!.included.length}`,
    );
  }
  const expExcluded = EXPECTED_EXCLUDED_COUNT[id];
  if (expExcluded !== undefined && pkg!.excluded.length !== expExcluded) {
    fail(
      `пакет ${id}: ожидается excluded = ${expExcluded}, найдено ${pkg!.excluded.length}`,
    );
  }
}

// Эксклюзивный пакет — без отдельного маршрута.
const exclusive = REPAIR_PACKAGES.find((p) => p.id === "exclusive")!;
if (exclusive.slug !== undefined) {
  fail("эксклюзивный пакет не должен иметь собственного slug");
}

// Связанные слаги — уникальные внутри одного списка.
for (const p of repairPages) {
  if (uniq(p.relatedSlugs).length !== p.relatedSlugs.length) {
    fail(`страница ${p.slug}: дубликаты в relatedSlugs`);
  }
}

// Проверка отсутствия автоматического выбора первых пяти позиций в коде.
try {
  const src = readFileSync(
    resolve(process.cwd(), "src/components/services/RepairServicePage.tsx"),
    "utf8",
  );
  if (/\.slice\(\s*0\s*,\s*5\s*\)/.test(src)) {
    fail("RepairServicePage.tsx: обнаружен запрещённый slice(0, 5) для примера сметы");
  }
} catch (e) {
  console.warn("validate-content: не удалось прочитать RepairServicePage.tsx", e);
}

// Подстраховка: проверяем общее число цен (на ошибку загрузки prices.ts).
if (PRICES.length === 0) fail("prices.ts пуст");

console.log("✓ validate-content: пройдена.");
