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
] as const;

const STUB_CONSTRUCTION_ROUTES = [
  "/stroitelstvo",
  "/mnogokvartirnye-doma",
  "/generalnyy-podryad",
  "/monolitnye-raboty",
  "/fundamenty",
  "/kladochnye-raboty",
  "/krovelnye-raboty",
  "/fasadnye-raboty",
] as const;

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
