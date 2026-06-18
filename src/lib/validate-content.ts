/**
 * Подэтап 2.3 — валидация наполнения страниц услуг.
 * Проверки выполняются только над данными ремонта (десять маршрутов 2.3).
 */
import { SERVICE_PAGES } from "@/data/service-pages";
import { REPAIR_PACKAGES } from "@/data/repair-packages";
import { ALL_PRICE_CATEGORIES } from "@/types/pricing";
import { SERVICE_FAQ } from "@/data/service-faq";

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

const FORBIDDEN = [
  /\blorem ipsum\b/i,
  /\bTODO\b/,
  /\bFIXME\b/,
  /Косадный/,
  /Ирландия/,
];

// Запрет конкретных гарантийных сроков на страницах ремонта (любая «N лет»
// или «N мес.» в связке с гарантией). Срок гарантии указывается в договоре,
// а не на сайте.
const WARRANTY_TERM_RX = /гаранти[а-я]+\s+\d+\s*(год|года|лет|мес)/i;

function fail(msg: string): never {
  console.error("validate-content:", msg);
  process.exit(1);
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
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

// Запрет отдельного маршрута для эксклюзивного ремонта.
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

  // Проверка запрещённых строк в текстовых полях.
  const blob = JSON.stringify(p);
  for (const rx of FORBIDDEN) {
    if (rx.test(blob)) fail(`страница ${p.slug}: запрещённая строка ${rx}`);
  }
  if (WARRANTY_TERM_RX.test(blob)) {
    fail(`страница ${p.slug}: конкретный гарантийный срок недопустим на сайте`);
  }
}

// Семь пакетов ремонта с утверждёнными ценами.
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

console.log("✓ validate-content: пройдена.");