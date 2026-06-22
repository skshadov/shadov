/**
 * Подэтап 2.3A — валидация наполнения страниц ремонта.
 * Проверки выполняются только над данными ремонта (десять маршрутов 2.3).
 */
import { SERVICE_PAGES } from "@/data/service-pages";
import { REPAIR_PACKAGES } from "@/data/repair-packages";
import { ALL_PRICE_CATEGORIES } from "@/types/pricing";
import { SERVICE_FAQ } from "@/data/service-faq";
import { PRICES, getPriceById } from "@/data/prices";
import {
  HOUSE_COMPLETION_DISCLAIMER,
  HOUSE_COMPLETION_LEVELS,
  HOUSE_TECHNOLOGIES,
  HOUSE_TURNKEY_WITH_BASIC_MATERIALS_LABEL,
} from "@/data/house-technologies";
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
  "/ukladka-plitki",
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
  "/ukladka-plitki": "Укладка плитки и керамогранита",
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
  "/ukladka-plitki": "2 800",
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
  /Строительство\s+новых\s+домов\s+под\s+ключ/,
  /Сантехнические\s+приборы\s+определения/,
  /Розетки\s+и\s+выключатели\s+аварийной/,
  /Розетки\s+и\s+выключатели\s+формирования/,
  /Предполагается\s+отдельно/,
  /Дыхающий/,
  /Под\s+дверью/,
  /Чайный\s+дом/,
];
const WARRANTY_TERM_RX = /гаранти[а-я]+\s+\d+\s*(год|года|лет|мес)/i;

function fail(msg: string): never {
  console.error("validate-content:", msg);
  process.exit(1);
}
function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) fail(msg);
}
function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
function normalizeSpaces(s: string): string {
  return s.replace(/\u00A0/g, " ");
}

// Подэтап 2.6: 11 активных страниц ремонта (включая активированную
// /ukladka-plitki). Заглушек среди ремонта быть не должно.
const repairPages = SERVICE_PAGES.filter((p) => p.category === "repair" && !p.isStub);
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

// ─────────────────────────────────────────────────────────────────────────
// Подэтап 2.4.1 — проверки строительных страниц (данные, не маршруты).
// На 2.4.1 18 строительных route-файлов остаются RouteStub — это
// валидатор не проверяет; данные проверяются как готовая база.
// ─────────────────────────────────────────────────────────────────────────

const EXPECTED_CONSTRUCTION_ROUTES = [
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

const CYRILLIC_PATTERN = /[А-Яа-яЁё]/;

const EXPECTED_CONSTRUCTION_H1: Record<string, string> = {
  "/stroitelstvo": "Строительство частных и многоквартирных домов в Москве и Московской области",
  "/stroitelstvo-domov-pod-klyuch": "Строительство частных домов под ключ в Москве и Московской области",
  "/karkasnye-doma": "Строительство каркасных домов под ключ",
  "/doma-iz-sip-paneley": "Строительство домов из СИП-панелей под ключ",
  "/doma-iz-brusa": "Строительство домов из профилированного бруса",
  "/doma-iz-kleenogo-brusa": "Строительство домов из клееного бруса",
  "/doma-iz-gazobetona": "Строительство домов из газобетона под ключ",
  "/doma-iz-keramicheskih-blokov": "Строительство домов из керамических блоков",
  "/kirpichnye-doma": "Строительство кирпичных домов под ключ",
  "/monolitnye-doma": "Строительство монолитных железобетонных домов",
  "/kombinirovannye-doma": "Строительство комбинированных домов",
  "/mnogokvartirnye-doma": "Строительство многоквартирных домов в качестве генерального подрядчика",
  "/generalnyy-podryad": "Генеральный подряд с единым центром ответственности",
  "/monolitnye-raboty": "Монолитные работы с инженерным, геодезическим и документальным контролем",
  "/fundamenty": "Устройство фундаментов для частных и многоквартирных зданий",
  "/kladochnye-raboty": "Кладочные работы с контролем геометрии, перевязки и конструктивных узлов",
  "/krovelnye-raboty": "Кровельные работы для частных домов и зданий",
  "/fasadnye-raboty": "Фасадные работы и наружная отделка зданий",
};

// Утверждённые стартовые цены (substring match, без NBSP).
// Маршруты с отсутствующей общей ценой (None) — не должны иметь startingPrice.
const EXPECTED_CONSTRUCTION_PRICE: Record<string, string | null> = {
  "/stroitelstvo": null,
  "/stroitelstvo-domov-pod-klyuch": "44 000",
  "/karkasnye-doma": "45 000",
  "/doma-iz-sip-paneley": "44 000",
  "/doma-iz-brusa": "48 000",
  "/doma-iz-kleenogo-brusa": "58 000",
  "/doma-iz-gazobetona": "65 000",
  "/doma-iz-keramicheskih-blokov": "72 000",
  "/kirpichnye-doma": "80 000",
  "/monolitnye-doma": "90 000",
  "/kombinirovannye-doma": "95 000",
  "/mnogokvartirnye-doma": null,
  "/generalnyy-podryad": "3%",
  "/monolitnye-raboty": "18 000",
  "/fundamenty": null,
  "/kladochnye-raboty": "7 000",
  "/krovelnye-raboty": "3 500",
  "/fasadnye-raboty": "1 800",
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
] as const;

const EXPECTED_COMPLETION_LEVELS = [
  "Коробка",
  "Тёплый контур",
  "Под чистовую отделку",
  "Под ключ",
] as const;

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
] as const;

const FORBIDDEN_TURNKEY_INCLUDED = [
  "Черная отделка",
  "Чёрная отделка",
  "Сантехнические приборы комплектации",
  "Розетки и выключатели комплектации",
] as const;

const FORBIDDEN_CONSTRUCTION = [
  /\bлучший\b/i,
  /\bсамый\s+(?:тёплый|теплый|надёжный|надежный)\b/i,
  /не\s+требует\s+обслуж/i,
  /абсолютн[а-я]*\s+(?:безопасн|пожаробезопасн)/i,
  /гарантированн[а-я]+\s+срок/i,
];

const constructionPages = SERVICE_PAGES.filter((p) => p.category === "construction");
const constructionRoutes = constructionPages.map((p) => p.route);

console.log("validate-content: строительных страниц", constructionPages.length);

if (constructionPages.length !== EXPECTED_CONSTRUCTION_ROUTES.length) {
  fail(
    `ожидается ${EXPECTED_CONSTRUCTION_ROUTES.length} строительных страниц, найдено ${constructionPages.length}`,
  );
}
assert(
  JSON.stringify(constructionRoutes) === JSON.stringify(EXPECTED_CONSTRUCTION_ROUTES),
  `массив строительных route не совпадает с утверждённым.\n  ожидается: ${JSON.stringify(EXPECTED_CONSTRUCTION_ROUTES)}\n  найдено:   ${JSON.stringify(constructionRoutes)}`,
);

const cSlugSet = new Set<string>();
const cRouteSet = new Set<string>();
const cH1Set = new Set<string>();
const cMetaSet = new Set<string>();

for (const p of constructionPages) {
  assert(
    !CYRILLIC_PATTERN.test(p.route),
    `Кириллица в route: ${p.route}`,
  );
  assert(
    !CYRILLIC_PATTERN.test(p.slug),
    `Кириллица в slug: ${p.slug}`,
  );

  if (cSlugSet.has(p.slug)) fail(`дублированный slug строительства: ${p.slug}`);
  if (cRouteSet.has(p.route)) fail(`дублированный route строительства: ${p.route}`);
  if (cH1Set.has(p.h1)) fail(`дублированный H1 строительства: ${p.h1}`);
  if (cMetaSet.has(p.metaTitle)) fail(`дублированный metaTitle строительства: ${p.metaTitle}`);
  cSlugSet.add(p.slug);
  cRouteSet.add(p.route);
  cH1Set.add(p.h1);
  cMetaSet.add(p.metaTitle);

  const expectedH1 = EXPECTED_CONSTRUCTION_H1[p.route];
  if (!expectedH1) fail(`строительная страница ${p.route}: нет ожидаемого H1`);
  if (p.h1 !== expectedH1) {
    fail(
      `строительная страница ${p.route}: H1 не совпадает.\n  ожидается: ${expectedH1}\n  найдено:   ${p.h1}`,
    );
  }

  const expectedPrice = EXPECTED_CONSTRUCTION_PRICE[p.route];
  if (expectedPrice === null) {
    if (p.startingPrice) {
      fail(
        `строительная страница ${p.route}: общая стартовая цена не должна выводиться, найдено "${p.startingPrice}"`,
      );
    }
  } else {
    if (!p.startingPrice) fail(`строительная страница ${p.route}: отсутствует startingPrice`);
    const normalized = normalizeSpaces(p.startingPrice!);
    if (!normalized.includes(expectedPrice)) {
      fail(
        `строительная страница ${p.route}: ожидается цена «${expectedPrice}», найдено "${p.startingPrice}"`,
      );
    }
  }

  const required: Array<[string, string[]]> = [
    ["included", p.included],
    ["excluded", p.excluded],
    ["stages", p.stages],
    ["qualityControl", p.qualityControl],
    ["documents", p.documents],
    ["timelineFactors", p.timelineFactors],
    ["benefits", p.benefits],
    ["suitableFor", p.suitableFor],
    ["technology", p.technology],
  ];
  for (const [name, arr] of required) {
    if (!arr.length) fail(`строительная страница ${p.slug}: поле ${name} пустое`);
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
  if (uniq(p.relatedSlugs).length !== p.relatedSlugs.length) {
    fail(`страница ${p.slug}: дубликаты в relatedSlugs`);
  }

  if (!p.estimateExampleItemIds || p.estimateExampleItemIds.length === 0) {
    fail(`строительная страница ${p.slug}: отсутствует estimateExampleItemIds`);
  }
  if (p.estimateExampleItemIds.length < 4) {
    fail(`строительная страница ${p.slug}: estimateExampleItemIds должен содержать не менее 4 строк`);
  }
  for (const id of p.estimateExampleItemIds) {
    if (!getPriceById(id)) {
      fail(`строительная страница ${p.slug}: позиция ${id} не найдена в prices.ts`);
    }
  }

  const blob = JSON.stringify(p);
  for (const rx of FORBIDDEN) {
    if (rx.test(blob)) fail(`строительная страница ${p.slug}: запрещённая строка ${rx}`);
  }
  for (const rx of FORBIDDEN_CONSTRUCTION) {
    if (rx.test(blob)) fail(`строительная страница ${p.slug}: запрещённое утверждение ${rx}`);
  }
  if (WARRANTY_TERM_RX.test(blob)) {
    fail(`строительная страница ${p.slug}: конкретный гарантийный срок недопустим`);
  }
}

// Проверка девяти технологий и пяти цен каждой.
if (HOUSE_TECHNOLOGIES.length !== 9) {
  fail(`ожидается 9 технологий, найдено ${HOUSE_TECHNOLOGIES.length}`);
}
assert(
  JSON.stringify(HOUSE_TECHNOLOGIES.map((t) => t.name)) === JSON.stringify(EXPECTED_TECHNOLOGY_NAMES),
  `названия технологий не совпадают с утверждёнными.\n  ожидается: ${JSON.stringify(EXPECTED_TECHNOLOGY_NAMES)}\n  найдено:   ${JSON.stringify(HOUSE_TECHNOLOGIES.map((t) => t.name))}`,
);
for (const t of HOUSE_TECHNOLOGIES) {
  for (const k of ["shell", "warmShell", "preFinish", "turnkey"] as const) {
    if (!t.workPrices[k] || t.workPrices[k] <= 0) {
      fail(`технология ${t.slug}: цена ${k} некорректна`);
    }
  }
  if (!t.turnkeyWithBasicMaterials || t.turnkeyWithBasicMaterials <= 0) {
    fail(`технология ${t.slug}: turnkeyWithBasicMaterials некорректна`);
  }
  for (const field of [
    "benefits",
    "limitations",
    "constructionStages",
    "suitableFoundations",
    "wallSystem",
    "floorSystems",
    "roofOptions",
    "engineeringSystems",
  ] as const) {
    if (!t[field].length) fail(`технология ${t.slug}: поле ${field} пустое`);
  }
  const techBlob = JSON.stringify(t);
  for (const rx of FORBIDDEN_CONSTRUCTION) {
    if (rx.test(techBlob)) fail(`технология ${t.slug}: запрещённое утверждение ${rx}`);
  }
}

// Четыре заполненных уровня готовности.
const EXPECTED_LEVEL_IDS = ["shell", "warmShell", "preFinish", "turnkey"];
if (HOUSE_COMPLETION_LEVELS.length !== 4) {
  fail(`ожидается 4 уровня готовности, найдено ${HOUSE_COMPLETION_LEVELS.length}`);
}
assert(
  JSON.stringify(HOUSE_COMPLETION_LEVELS.map((l) => l.name)) === JSON.stringify(EXPECTED_COMPLETION_LEVELS),
  `названия уровней готовности не совпадают с утверждёнными.\n  ожидается: ${JSON.stringify(EXPECTED_COMPLETION_LEVELS)}\n  найдено:   ${JSON.stringify(HOUSE_COMPLETION_LEVELS.map((l) => l.name))}`,
);
assert(
  HOUSE_TURNKEY_WITH_BASIC_MATERIALS_LABEL === "Под ключ с базовыми материалами",
  `заголовок цены с материалами не совпадает: ${HOUSE_TURNKEY_WITH_BASIC_MATERIALS_LABEL}`,
);
for (const id of EXPECTED_LEVEL_IDS) {
  const lvl = HOUSE_COMPLETION_LEVELS.find((l) => l.id === id);
  if (!lvl) fail(`отсутствует уровень готовности ${id}`);
  if (!lvl!.included.length) fail(`уровень ${id}: included пустой`);
  if (!lvl!.excluded.length) fail(`уровень ${id}: excluded пустой`);
  if (!lvl!.description) fail(`уровень ${id}: description пустое`);
}
const turnkeyLevel = HOUSE_COMPLETION_LEVELS.find((l) => l.id === "turnkey");
if (!turnkeyLevel) fail("отсутствует уровень готовности turnkey");
assert(
  JSON.stringify(turnkeyLevel.included) === JSON.stringify(EXPECTED_TURNKEY_INCLUDED),
  `состав уровня «Под ключ» не совпадает с утверждённым.\n  ожидается: ${JSON.stringify(EXPECTED_TURNKEY_INCLUDED)}\n  найдено:   ${JSON.stringify(turnkeyLevel.included)}`,
);
for (const forbidden of FORBIDDEN_TURNKEY_INCLUDED) {
  assert(
    !turnkeyLevel.included.includes(forbidden),
    `уровень «Под ключ»: запрещённое значение included: ${forbidden}`,
  );
}
assert(
  HOUSE_COMPLETION_DISCLAIMER ===
    "Точный состав комплектации фиксируется в смете и договоре с учётом проекта выбранного дома.",
  `подпись уровней готовности не совпадает: ${HOUSE_COMPLETION_DISCLAIMER}`,
);

// Проверка отсутствия автоматического slice(0, 5) в строительном каркасе.
try {
  const src = readFileSync(
    resolve(process.cwd(), "src/components/services/ConstructionServicePage.tsx"),
    "utf8",
  );
  if (/\.slice\(\s*0\s*,\s*5\s*\)/.test(src)) {
    fail("ConstructionServicePage.tsx: обнаружен запрещённый slice(0, 5)");
  }
} catch (e) {
  console.warn("validate-content: не удалось прочитать ConstructionServicePage.tsx", e);
}

// ─────────────────────────────────────────────────────────────────────────
// Подэтап 2.4.2 — проверка route-файлов строительного раздела.
// 10 утверждённых маршрутов должны быть подключены к ConstructionServicePage
// и не содержать noindex. Оставшиеся 8 — RouteStub с noindex, follow.
// ─────────────────────────────────────────────────────────────────────────

const ACTIVATED_CONSTRUCTION_ROUTES = [
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

const STUB_CONSTRUCTION_ROUTES: readonly string[] = [];

function readRoute(route: string): string {
  const file = `src/routes${route}.tsx`;
  return readFileSync(resolve(process.cwd(), file), "utf8");
}

for (const route of ACTIVATED_CONSTRUCTION_ROUTES) {
  let src: string;
  try {
    src = readRoute(route);
  } catch (e) {
    fail(`route-файл ${route} не найден: ${e}`);
  }
  if (/RouteStub/.test(src)) {
    fail(`route-файл ${route}: всё ещё использует RouteStub`);
  }
  if (/noindex/i.test(src)) {
    fail(`route-файл ${route}: содержит noindex`);
  }
  if (!/ConstructionServicePage/.test(src)) {
    fail(`route-файл ${route}: не подключён ConstructionServicePage`);
  }
  if (!/rel:\s*"canonical"/.test(src)) {
    fail(`route-файл ${route}: отсутствует canonical`);
  }
  if (!/og:url/.test(src) || !/og:title/.test(src) || !/og:description/.test(src)) {
    fail(`route-файл ${route}: отсутствуют Open Graph метатеги`);
  }
  if (!/BreadcrumbList/.test(src)) {
    fail(`route-файл ${route}: отсутствует BreadcrumbList`);
  }
  if (/\bas\s+any\b/.test(src)) {
    fail(`route-файл ${route}: запрещён as any`);
  }
}

for (const route of STUB_CONSTRUCTION_ROUTES) {
  let src: string;
  try {
    src = readRoute(route);
  } catch (e) {
    fail(`route-файл ${route} не найден: ${e}`);
  }
  if (!/RouteStub/.test(src)) {
    fail(`route-файл ${route}: должен оставаться RouteStub`);
  }
  if (!/noindex,\s*follow/.test(src)) {
    fail(`route-файл ${route}: должен сохранять noindex, follow`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Подэтап 2.4.2A — единый источник истины: сверка 45 цен между prices.ts и
 // HOUSE_TECHNOLOGIES, точное совпадение стартовой цены страницы с уровнем
 // turnkey, контроль materialsIncluded и обязательное отсутствие пяти
 // запрещённых пунктов в составе «Под ключ».
// ─────────────────────────────────────────────────────────────────────────

const TURNKEY_FORBIDDEN_IN_INCLUDED = [
  "Мебель",
  "Кухня",
  "Бытовая техника",
  "Благоустройство",
  "Дорогостоящее оборудование",
] as const;
const TURNKEY_REQUIRED_IN_EXCLUDED = [
  "Мебель рассчитывается отдельно",
  "Кухня рассчитывается отдельно",
  "Бытовая техника рассчитывается отдельно",
  "Благоустройство рассчитывается отдельно",
  "Дорогостоящее оборудование рассчитывается отдельно",
] as const;
const EXPECTED_TURNKEY_EXCLUDED = TURNKEY_REQUIRED_IN_EXCLUDED;
assert(
  JSON.stringify(turnkeyLevel.excluded) === JSON.stringify(EXPECTED_TURNKEY_EXCLUDED),
  `исключения уровня «Под ключ» не совпадают.\n  ожидается: ${JSON.stringify(EXPECTED_TURNKEY_EXCLUDED)}\n  найдено:   ${JSON.stringify(turnkeyLevel.excluded)}`,
);
for (const v of TURNKEY_FORBIDDEN_IN_INCLUDED) {
  if (turnkeyLevel.included.includes(v)) {
    fail(`уровень «Под ключ»: запрещённое значение в included: ${v}`);
  }
}
for (const v of TURNKEY_REQUIRED_IN_EXCLUDED) {
  if (!turnkeyLevel.excluded.includes(v)) {
    fail(`уровень «Под ключ»: отсутствует обязательный excluded: ${v}`);
  }
}
if (turnkeyLevel.included.length !== 16) {
  fail(`уровень «Под ключ»: ожидается 16 included, найдено ${turnkeyLevel.included.length}`);
}

// Сверка 45 цен между prices.ts и HOUSE_TECHNOLOGIES.
let priceMatches = 0;
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
    if (!item) fail(`prices.ts: отсутствует позиция ${id}`);
    if (item!.priceFrom !== expected) {
      fail(
        `несоответствие цены ${id}: prices.ts=${item!.priceFrom}, HOUSE_TECHNOLOGIES=${expected}`,
      );
    }
    priceMatches++;
  }
}
if (priceMatches !== 45) {
  fail(`ожидается 45 проверок цен, выполнено ${priceMatches}`);
}

// materialsIncluded=true только у 9 строк категории house_construction_materials.
const materialsTrue = PRICES.filter((p) => p.materialsIncluded === true);
if (materialsTrue.length !== 9) {
  fail(`materialsIncluded=true должен быть у 9 строк, найдено ${materialsTrue.length}`);
}
for (const p of materialsTrue) {
  if (p.category !== "house_construction_materials") {
    fail(`materialsIncluded=true вне house_construction_materials: ${p.id}`);
  }
}

// Стартовая цена технологической страницы должна точно соответствовать turnkey.
const TECH_SLUG_TO_TURNKEY: Record<string, number> = Object.fromEntries(
  HOUSE_TECHNOLOGIES.map((t) => [t.slug, t.workPrices.turnkey]),
);
for (const p of constructionPages) {
  const turnkey = TECH_SLUG_TO_TURNKEY[p.slug];
  if (turnkey === undefined) continue;
  const expected = turnkey.toLocaleString("ru-RU").replace(/\u00A0/g, " ");
  const got = normalizeSpaces(p.startingPrice ?? "");
  if (!got.includes(expected)) {
    fail(
      `страница ${p.route}: startingPrice должна содержать ${expected} (turnkey), найдено "${p.startingPrice}"`,
    );
  }
}

console.log("✓ validate-content: пройдена.");

// ─────────────────────────────────────────────────────────────────────────
// Подэтап 2.4.3 — семь специализированных строительных страниц.
// Сверяем количество цен по категориям, разделение кровли на отдельные
// работы и комплексные решения, отсутствие номера СРО, заявлений
// о собственной лаборатории и сохранность ровно одной заглушки.
// ─────────────────────────────────────────────────────────────────────────

const STAGE_2_4_3_ROUTES = [
  "/mnogokvartirnye-doma",
  "/generalnyy-podryad",
  "/monolitnye-raboty",
  "/fundamenty",
  "/kladochnye-raboty",
  "/krovelnye-raboty",
  "/fasadnye-raboty",
] as const;

if (ACTIVATED_CONSTRUCTION_ROUTES.length !== 18) {
  fail(
    `ожидается 18 активных строительных маршрутов, найдено ${ACTIVATED_CONSTRUCTION_ROUTES.length}`,
  );
}
if (STUB_CONSTRUCTION_ROUTES.length !== 0) {
  fail(
    `ожидается 0 строительных заглушек, найдено ${STUB_CONSTRUCTION_ROUTES.length}`,
  );
}

// Каждая страница 2.4.3 использует ConstructionServicePage без noindex и без RouteStub.
for (const route of STAGE_2_4_3_ROUTES) {
  const src = readRoute(route);
  if (/RouteStub/.test(src)) fail(`2.4.3 ${route}: всё ещё RouteStub`);
  if (/noindex/i.test(src)) fail(`2.4.3 ${route}: содержит noindex`);
  if (!/ConstructionServicePage/.test(src)) {
    fail(`2.4.3 ${route}: не подключён ConstructionServicePage`);
  }
  if (!/BreadcrumbList/.test(src)) fail(`2.4.3 ${route}: отсутствует BreadcrumbList`);
  if (!/rel:\s*"canonical"/.test(src)) fail(`2.4.3 ${route}: отсутствует canonical`);
  if (!/og:url/.test(src) || !/og:title/.test(src) || !/og:description/.test(src)) {
    fail(`2.4.3 ${route}: отсутствуют Open Graph метатеги`);
  }
  if (/\bas\s+any\b/.test(src)) fail(`2.4.3 ${route}: запрещён as any`);
}

// Запрещено выводить общую стартовую цену на /fundamenty и /mnogokvartirnye-doma.
for (const route of ["/fundamenty", "/mnogokvartirnye-doma"] as const) {
  const p = constructionPages.find((x) => x.route === route);
  if (!p) fail(`страница ${route}: не найдена`);
  if (p!.startingPrice) {
    fail(`страница ${route}: общая стартовая цена недопустима, найдено "${p!.startingPrice}"`);
  }
}

// Количество цен по строительным категориям 2.4.3.
const EXPECTED_CATEGORY_COUNTS: Record<string, number> = {
  general_contracting: 7,
  monolithic: 20,
  foundations: 20,
  masonry: 18,
  facades: 15,
};
for (const [cat, expected] of Object.entries(EXPECTED_CATEGORY_COUNTS)) {
  const count = PRICES.filter((x) => x.category === (cat as never)).length;
  if (count !== expected) {
    fail(`категория ${cat}: ожидается ${expected} позиций, найдено ${count}`);
  }
}

// Кровля: 21 отдельная работа + 7 комплексных решений (id содержит "roofing-complex-").
const roofingAll = PRICES.filter((x) => x.category === ("roofing" as never));
const roofingComplex = roofingAll.filter((x) => x.id.startsWith("roofing-complex-"));
const roofingSeparate = roofingAll.filter((x) => !x.id.startsWith("roofing-complex-"));
if (roofingSeparate.length !== 21) {
  fail(`кровля: ожидается 21 отдельная работа, найдено ${roofingSeparate.length}`);
}
if (roofingComplex.length !== 7) {
  fail(`кровля: ожидается 7 комплексных решений, найдено ${roofingComplex.length}`);
}

// На семи страницах 2.4.3 запрещены заявления о номере СРО и собственной лаборатории.
const SRO_NUMBER_RX = /СРО[\s-]*[№N]?\s*\d/i;
const OWN_LAB_RX = /собственн[а-я]*\s+лаборатори[а-я]+/i;
for (const route of STAGE_2_4_3_ROUTES) {
  const p = constructionPages.find((x) => x.route === route)!;
  const blob = JSON.stringify(p);
  if (SRO_NUMBER_RX.test(blob)) fail(`страница ${route}: упоминание номера СРО недопустимо`);
  if (OWN_LAB_RX.test(blob)) fail(`страница ${route}: заявление о собственной лаборатории недопустимо`);
  const src = readRoute(route);
  if (SRO_NUMBER_RX.test(src)) fail(`route ${route}: упоминание номера СРО недопустимо`);
  if (OWN_LAB_RX.test(src)) fail(`route ${route}: заявление о собственной лаборатории недопустимо`);
}

console.log("✓ validate-content 2.4.3: пройдена.");

// ─────────────────────────────────────────────────────────────────────────
// Подэтап 2.5.1 — инженерный раздел.
// Все 6 маршрутов остаются RouteStub с noindex, follow. EngineeringServicePage
// к route-файлам не подключён. Сверка количества категорий и позиций.
// ─────────────────────────────────────────────────────────────────────────

import { ENGINEERING_SERVICE_PAGES } from "@/data/service-pages-engineering";

// Подэтап 2.5.2 — все 6 инженерных маршрутов активированы (EngineeringServicePage),
// noindex снят, RouteStub удалён.
const ENGINEERING_ACTIVE_ROUTES = [
  "/inzhenernye-sistemy",
  "/elektromontazh",
  "/santehnika",
  "/vodosnabzhenie-kanalizatsiya",
  "/otoplenie",
  "/teplyy-pol",
] as const;

if (ENGINEERING_SERVICE_PAGES.length !== 6) {
  fail(
    `ожидается 6 инженерных записей, найдено ${ENGINEERING_SERVICE_PAGES.length}`,
  );
}

const ENG_ROUTES = ENGINEERING_SERVICE_PAGES.map((p) => p.route);
assert(
  JSON.stringify(ENG_ROUTES) === JSON.stringify(ENGINEERING_ACTIVE_ROUTES),
  `массив инженерных route не совпадает с утверждённым.\n  ожидается: ${JSON.stringify(ENGINEERING_ACTIVE_ROUTES)}\n  найдено:   ${JSON.stringify(ENG_ROUTES)}`,
);

// Подэтап 2.6: 35 = repair(11) + construction(18) + engineering(6).
// /ukladka-plitki активирована, isStub=false, RouteStub снят.
if (SERVICE_PAGES.length !== 35) {
  fail(`SERVICE_PAGES: ожидается 35, найдено ${SERVICE_PAGES.length}`);
}
const engineeringPages = SERVICE_PAGES.filter((p) => p.category === "engineering");
if (engineeringPages.length !== 6) {
  fail(`инженерных записей в SERVICE_PAGES: ожидается 6, найдено ${engineeringPages.length}`);
}

const tilePages = SERVICE_PAGES.filter((p) => p.slug === "ukladka-plitki");
if (tilePages.length !== 1) fail(`плиточных записей: ожидается 1, найдено ${tilePages.length}`);
const tile = tilePages[0];
if (tile.category === "engineering") fail("/ukladka-plitki не должна быть category=engineering");
if (tile.category !== "repair") fail(`/ukladka-plitki: ожидается category=repair, найдено ${tile.category}`);
if (tile.isStub === true) fail("/ukladka-plitki: на этапе 2.6 активирована, isStub быть не должно");
if (ENGINEERING_SERVICE_PAGES.some((p) => p.slug === "ukladka-plitki")) {
  fail("/ukladka-plitki не должна входить в ENGINEERING_SERVICE_PAGES");
}
{
  const tileRouteSrc = readFileSync(resolve(process.cwd(), "src/routes/ukladka-plitki.tsx"), "utf8");
  if (/RouteStub/.test(tileRouteSrc)) fail("/ukladka-plitki: RouteStub снят на этапе 2.6");
  if (/noindex/i.test(tileRouteSrc)) fail("/ukladka-plitki: noindex снят на этапе 2.6");
  if (/EngineeringServicePage/.test(tileRouteSrc)) fail("/ukladka-plitki: EngineeringServicePage не должен подключаться");
  if (!/RepairServicePage/.test(tileRouteSrc)) fail("/ukladka-plitki: должен использовать RepairServicePage");
  if (!/rel:\s*"canonical"/.test(tileRouteSrc)) fail("/ukladka-plitki: отсутствует canonical");
  if (!/BreadcrumbList/.test(tileRouteSrc)) fail("/ukladka-plitki: отсутствует BreadcrumbList");
}
const engRouteSet = new Set<string>();
const engSlugSet = new Set<string>();
for (const p of engineeringPages) {
  if (engRouteSet.has(p.route)) fail(`дубликат инженерного route: ${p.route}`);
  if (engSlugSet.has(p.slug)) fail(`дубликат инженерного slug: ${p.slug}`);
  engRouteSet.add(p.route);
  engSlugSet.add(p.slug);
}

for (const p of ENGINEERING_SERVICE_PAGES) {
  if (CYRILLIC_PATTERN.test(p.route)) fail(`кириллица в route: ${p.route}`);
  if (CYRILLIC_PATTERN.test(p.slug)) fail(`кириллица в slug: ${p.slug}`);
}

for (const route of ENGINEERING_ACTIVE_ROUTES) {
  let src: string;
  try {
    src = readRoute(route);
  } catch (e) {
    fail(`route-файл ${route} не найден: ${e}`);
  }
  if (/RouteStub/.test(src)) {
    fail(`инженерный route ${route}: всё ещё использует RouteStub`);
  }
  if (/noindex/i.test(src)) {
    fail(`инженерный route ${route}: содержит noindex`);
  }
  if (!/EngineeringServicePage/.test(src)) {
    fail(`инженерный route ${route}: не подключён EngineeringServicePage`);
  }
  if (!/rel:\s*"canonical"/.test(src)) {
    fail(`инженерный route ${route}: отсутствует canonical`);
  }
  if (!/og:url/.test(src) || !/og:title/.test(src) || !/og:description/.test(src)) {
    fail(`инженерный route ${route}: отсутствуют Open Graph метатеги`);
  }
  if (!/BreadcrumbList/.test(src)) {
    fail(`инженерный route ${route}: отсутствует BreadcrumbList`);
  }
  if (/\bas\s+any\b/.test(src)) {
    fail(`инженерный route ${route}: запрещён as any`);
  }
}

const EXPECTED_ENGINEERING_CATEGORY_COUNTS: Record<string, number> = {
  electrical_packages: 3,
  electrical: 22,
  plumbing_packages: 5,
  plumbing: 21,
  water_supply: 13,
  heating_packages: 6,
  heating: 18,
  underfloor_heating: 10,
};
let engineeringTotalItems = 0;
for (const [cat, expected] of Object.entries(EXPECTED_ENGINEERING_CATEGORY_COUNTS)) {
  const count = PRICES.filter((x) => x.category === (cat as never)).length;
  if (count !== expected) {
    fail(`инженерная категория ${cat}: ожидается ${expected}, найдено ${count}`);
  }
  engineeringTotalItems += count;
}
if (engineeringTotalItems !== 98) {
  fail(`инженерные позиции: ожидается 98, найдено ${engineeringTotalItems}`);
}

const SMALL_OPERATION_RX = /штроб|отверсти|крепление|соединени|демонтаж|подготовительн/i;
for (const p of ENGINEERING_SERVICE_PAGES) {
  if (p.startingPriceItemId != null) {
    const item = getPriceById(p.startingPriceItemId);
    if (!item) fail(`страница ${p.route}: startingPriceItemId ${p.startingPriceItemId} не найден в prices.ts`);
    if (SMALL_OPERATION_RX.test(item!.name)) {
      fail(`страница ${p.route}: стартовая позиция «${item!.name}» — мелкая операция`);
    }
    // Цена в Hero (если есть) должна содержать число позиции.
    if (p.startingPrice && typeof item!.priceFrom === "number") {
      const expectedNum = item!.priceFrom.toLocaleString("ru-RU").replace(/\u00A0/g, " ");
      if (!normalizeSpaces(p.startingPrice).includes(expectedNum)) {
        fail(`страница ${p.route}: startingPrice не совпадает с prices.ts (${expectedNum})`);
      }
    }
  }
  // /inzhenernye-sistemy не должен иметь startingPrice.
  if (p.route === "/inzhenernye-sistemy" && p.startingPrice) {
    fail(`/inzhenernye-sistemy: общая числовая стартовая цена запрещена`);
  }
  for (const c of p.priceCategoryIds) {
    if (!ALL_PRICE_CATEGORIES.includes(c)) fail(`страница ${p.route}: неизвестная ценовая категория ${c}`);
  }
  for (const id of p.faqIds) {
    if (!SERVICE_FAQ.some((f) => f.id === id)) fail(`страница ${p.route}: FAQ ${id} не найден`);
  }
  for (const s of p.relatedSlugs) {
    if (!SERVICE_PAGES.some((x) => x.slug === s)) fail(`страница ${p.route}: relatedSlug ${s} не найден`);
  }
  for (const id of p.estimateExampleItemIds ?? []) {
    if (!getPriceById(id)) fail(`страница ${p.route}: estimateExampleItemIds ${id} не найден`);
  }
  const blob = JSON.stringify(p);
  if (SRO_NUMBER_RX.test(blob)) fail(`инженерная страница ${p.route}: упоминание номера СРО недопустимо`);
  if (OWN_LAB_RX.test(blob)) fail(`инженерная страница ${p.route}: заявление о собственной лаборатории недопустимо`);
  if (WARRANTY_TERM_RX.test(blob)) fail(`инженерная страница ${p.route}: конкретный гарантийный срок недопустим`);
  for (const rx of FORBIDDEN) {
    if (rx.test(blob)) fail(`инженерная страница ${p.route}: запрещённая строка ${rx}`);
  }
}

// Утверждение «тёплый пол как единственный источник отопления» запрещено.
// Допустимы только формулировки с отрицанием («не во всех случаях …»).
const TP_AFFIRM_RX = /(является|достаточен|может\s+быть|обеспечивает)[^.]{0,40}единственн[а-я]+\s+источник/i;
const tpBlob = JSON.stringify(ENGINEERING_SERVICE_PAGES.find((p) => p.slug === "teplyy-pol"));
if (TP_AFFIRM_RX.test(tpBlob) && !/не\s+во\s+всех\s+случаях[^.]{0,80}единственн/i.test(tpBlob)) {
  fail("/teplyy-pol: утверждение о единственном источнике отопления недопустимо");
}

// Запрет slice(0, 5) в инженерных компонентах.
for (const f of [
  "src/components/services/EngineeringServicePage.tsx",
  "src/components/engineering/EngineeringPriceGroups.tsx",
  "src/components/engineering/EngineeringDirections.tsx",
  "src/components/engineering/EngineeringSystemDetails.tsx",
  "src/components/engineering/EngineeringPackageCard.tsx",
]) {
  try {
    const src = readFileSync(resolve(process.cwd(), f), "utf8");
    if (/\.slice\(\s*0\s*,\s*5\s*\)/.test(src)) {
      fail(`${f}: обнаружен запрещённый slice(0, 5)`);
    }
  } catch {
    fail(`${f}: файл не найден`);
  }
}

console.log("✓ validate-content 2.5.1: пройдена.");

// ─────────────────────────────────────────────────────────────────────────
// Подэтап 2.5.3 — калькулятор предварительной стоимости.
// ─────────────────────────────────────────────────────────────────────────

import {
  CALCULATOR_MODE_SPECS,
  CALCULATOR_LINKS_FROM_SERVICES,
  CALCULATOR_METADATA,
  CALCULATOR_ROUTE,
  PACKAGE_CONFLICTS,
  CALCULATOR_FORMULAS,
} from "@/data/calculator-specification";
import { CALCULATOR_LOCAL_STORAGE_KEY, CALCULATOR_MODES } from "@/types/calculator";
import { MAIN_NAV } from "@/data/navigation";
import { ROUTES } from "@/data/routes";

if (CALCULATOR_ROUTE !== "/kalkulyator-stoimosti") fail("route калькулятора не совпадает");
if (CALCULATOR_METADATA.canonical !== "https://shadov.pro/kalkulyator-stoimosti") fail("canonical калькулятора неверный");
if (CALCULATOR_METADATA.h1 !== "Калькулятор предварительной стоимости работ") fail("H1 калькулятора неверный");
if (CALCULATOR_MODES.length !== 4) fail(`режимов калькулятора ожидается 4, получено ${CALCULATOR_MODES.length}`);

{
  const src = readFileSync(resolve(process.cwd(), "src/routes/kalkulyator-stoimosti.tsx"), "utf8");
  if (/noindex/i.test(src)) fail("страница калькулятора содержит noindex");
  if (!new RegExp(`title:\\s*TITLE`).test(src) && !src.includes(CALCULATOR_METADATA.title)) {
    fail("title страницы калькулятора не совпадает");
  }
  if (!src.includes(CALCULATOR_METADATA.canonical)) fail("canonical страницы калькулятора не совпадает");
  if (!/BreadcrumbList/.test(src)) fail("страница калькулятора без BreadcrumbList");
  if (!/WebApplication/.test(src)) fail("страница калькулятора без WebApplication JSON-LD");
  if (/aggregateRating|ratingValue|priceCurrency/.test(src)) fail("WebApplication не должен содержать рейтинг или цену");
}
{
  // Ссылка в навигации одна.
  const flat: string[] = [];
  for (const it of MAIN_NAV) {
    if ("items" in it) {
      flat.push(it.to);
      for (const sub of it.items) flat.push(sub.to);
    } else flat.push(it.to);
  }
  const occ = flat.filter((t) => t === CALCULATOR_ROUTE).length;
  if (occ !== 1) fail(`ссылка на калькулятор в MAIN_NAV: ожидается 1, получено ${occ}`);
  if (!ROUTES.some((r) => r.path === CALCULATOR_ROUTE)) fail("ROUTES не содержит калькулятор");
}
{
  // Все ID и категории в спецификации существуют.
  for (const spec of CALCULATOR_MODE_SPECS) {
    for (const c of spec.priceCategories) {
      if (!ALL_PRICE_CATEGORIES.includes(c)) fail(`калькулятор: неизвестная категория ${c}`);
    }
  }
  for (const [pkg, conflicts] of Object.entries(PACKAGE_CONFLICTS)) {
    if (!ALL_PRICE_CATEGORIES.includes(pkg as never)) fail(`PACKAGE_CONFLICTS: неизвестная пакетная категория ${pkg}`);
    for (const c of conflicts) {
      if (!ALL_PRICE_CATEGORIES.includes(c)) fail(`PACKAGE_CONFLICTS: неизвестная категория ${c}`);
    }
  }
}
{
  // CTA ведут на существующий route и не подключены к /ukladka-plitki.
  for (const link of CALCULATOR_LINKS_FROM_SERVICES) {
    if (!SERVICE_PAGES.some((p) => p.slug === link.slug)) fail(`CTA калькулятора ссылается на отсутствующий slug ${link.slug}`);
    if (!(CALCULATOR_MODES as string[]).includes(link.mode)) fail(`CTA mode неизвестен: ${link.mode}`);
    if (link.category && !ALL_PRICE_CATEGORIES.includes(link.category as never)) fail(`CTA category неизвестна: ${link.category}`);
  }
}
{
  // Движок без eval и без NaN/Infinity литералов.
  const engineSrc = readFileSync(resolve(process.cwd(), "src/lib/calculator-engine.ts"), "utf8");
  if (/\beval\s*\(/.test(engineSrc)) fail("calculator-engine: запрещён eval");
  if (/NaN\s*₽|Infinity\s*₽/.test(engineSrc)) fail("calculator-engine: литералы NaN ₽/Infinity ₽");
  if (CALCULATOR_FORMULAS.length < 4) {
    fail("calculator-engine: формулы не зарегистрированы (ожидается ≥ 4)");
  }
}
{
  // LocalStorage versioned, без персональных данных в коде калькулятора.
  if (!/^shadov-cost-calculator-v\d+$/.test(CALCULATOR_LOCAL_STORAGE_KEY)) fail("localStorage key должен быть versioned");
  const calcSrcFiles = [
    "src/components/calculator/CostCalculator.tsx",
    "src/components/calculator/CalculatorInputs.tsx",
    "src/components/calculator/CalculatorPriceItems.tsx",
    "src/components/calculator/CalculatorSummary.tsx",
  ];
  const PERSONAL_RX = /(телефон|phone|email|почта|фамили|имя\s*клиент)/i;
  for (const f of calcSrcFiles) {
    const s = readFileSync(resolve(process.cwd(), f), "utf8");
    if (PERSONAL_RX.test(s)) fail(`${f}: персональные данные в калькуляторе не сохраняются`);
    if (/\beval\s*\(/.test(s)) fail(`${f}: запрещён eval`);
  }
}
{
  const tile = readFileSync(resolve(process.cwd(), "src/routes/ukladka-plitki.tsx"), "utf8");
  if (/RouteStub/.test(tile)) fail("/ukladka-plitki: RouteStub снят на этапе 2.6");
  if (/noindex/i.test(tile)) fail("/ukladka-plitki: noindex снят на этапе 2.6");
}

console.log("✓ validate-content 2.5.3: пройдена.");
