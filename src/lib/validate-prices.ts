/**
 * Подэтап 2.1A — валидатор базы цен и страниц услуг.
 * Запуск: bun src/lib/validate-prices.ts
 */
import { PRICES } from "@/data/prices";
import { SERVICE_PAGES } from "@/data/service-pages";
import { ALL_PRICE_CATEGORIES } from "@/types/pricing";
import type { PriceItem } from "@/types/pricing";

type Issue = { id?: string; rule: string; message: string };

// Запрещённые подстроки (включая повреждённые формулировки из отчётов пользователя).
const FORBIDDEN_SUBSTRINGS = [
  "PRICE_CATEGORIES_PENDING_INPUT",
  "заглушка",
  "введите позднее",
  "pending",
  "TODO",
  "FIXME",
  "Косадный",
  "Ирландия",
  "Под дверью",
  "С контейнера",
  "ведение роста",
  "Lorem",
  "lorem",
];

// Допустимые unitLabel (§2 запроса).
const ALLOWED_UNIT_LABELS = new Set([
  "м² пола",
  "м² площади дома",
  "м² кровли",
  "м² поверхности",
  "м³ бетона",
  "м² плиты",
  "м² дома",
]);

function validatePrices(items: PriceItem[]): Issue[] {
  const issues: Issue[] = [];
  const seen = new Set<string>();

  for (const p of items) {
    if (!p.id) issues.push({ rule: "id-required", message: "Позиция без ID" });
    if (seen.has(p.id)) issues.push({ id: p.id, rule: "id-unique", message: "Дублирующийся ID" });
    seen.add(p.id);

    if (!p.category) issues.push({ id: p.id, rule: "category-required", message: "Нет категории" });
    if (p.actualDate !== "2026-06") issues.push({ id: p.id, rule: "actual-date", message: "actualDate должен быть '2026-06'" });
    if (typeof p.sortOrder !== "number") issues.push({ id: p.id, rule: "sort-order", message: "Нет sortOrder" });

    if (p.priceFrom !== undefined && p.priceFrom <= 0) issues.push({ id: p.id, rule: "no-zero", message: "Нулевая или отрицательная priceFrom" });
    if (p.priceTo !== undefined && p.priceTo <= 0) issues.push({ id: p.id, rule: "no-zero", message: "Нулевая или отрицательная priceTo" });
    if (p.priceFrom !== undefined && p.priceTo !== undefined && p.priceFrom > p.priceTo)
      issues.push({ id: p.id, rule: "range-order", message: "priceFrom > priceTo" });

    if (p.percentageFrom !== undefined && p.percentageFrom <= 0) issues.push({ id: p.id, rule: "no-zero-pct", message: "Нулевой percentageFrom" });
    if (p.percentageTo !== undefined && p.percentageTo <= 0) issues.push({ id: p.id, rule: "no-zero-pct", message: "Нулевой percentageTo" });
    if (p.percentageFrom !== undefined && p.percentageTo !== undefined && p.percentageFrom > p.percentageTo)
      issues.push({ id: p.id, rule: "pct-range-order", message: "percentageFrom > percentageTo" });

    if (p.priceFrom !== undefined && p.percentageFrom !== undefined)
      issues.push({ id: p.id, rule: "exclusive", message: "Одновременно priceFrom и percentageFrom" });

    if ((p.priceFrom !== undefined || p.percentageFrom !== undefined) && p.priceLabel)
      issues.push({ id: p.id, rule: "exclusive-label", message: "Одновременно числовая цена и priceLabel" });

    // Каждая числовая позиция должна иметь unit (или процентную основу).
    if (p.priceFrom !== undefined && !p.unit)
      issues.push({ id: p.id, rule: "unit-required", message: "Числовая цена без единицы" });

    // priceLabel="Рассчитывается отдельно" — без числовой цены.
    if (p.priceLabel === "Рассчитывается отдельно" && (p.priceFrom !== undefined || p.percentageFrom !== undefined))
      issues.push({ id: p.id, rule: "calc-separate", message: "«Рассчитывается отдельно» не должно иметь числовой цены" });

    // materialsIncluded=true разрешён только для house_construction_materials.
    if (p.materialsIncluded && p.category !== "house_construction_materials")
      issues.push({ id: p.id, rule: "materials-flag", message: "materialsIncluded=true вне таблицы домов с базовыми материалами" });

    // unitLabel — только из утверждённого набора.
    if (p.unitLabel && !ALLOWED_UNIT_LABELS.has(p.unitLabel))
      issues.push({ id: p.id, rule: "unit-label-allowed", message: `Неутверждённое значение unitLabel: «${p.unitLabel}»` });

    const serialized = JSON.stringify(p);
    if (/lorem ipsum/i.test(serialized)) issues.push({ id: p.id, rule: "lorem", message: "Lorem ipsum в данных" });
    for (const word of FORBIDDEN_SUBSTRINGS) {
      if (p.name.includes(word) || (p.note ?? "").includes(word))
        issues.push({ id: p.id, rule: "forbidden-text", message: `Запрещённая подстрока «${word}»` });
    }
  }

  // Все 24 категории должны присутствовать и быть непустыми.
  const byCat: Record<string, number> = {};
  for (const p of items) byCat[p.category] = (byCat[p.category] ?? 0) + 1;
  for (const c of ALL_PRICE_CATEGORIES) {
    if (!byCat[c]) issues.push({ rule: "category-empty", message: `Категория «${c}» пуста или отсутствует` });
  }

  return issues;
}

function validateServicePages(): Issue[] {
  const issues: Issue[] = [];

  // Подэтап 2.6: всего 35 = 18 строительных + 11 ремонта (включая
  // активированную плиточную страницу) + 6 инженерных. Заглушек 0.
  if (SERVICE_PAGES.length !== 35)
    issues.push({ rule: "service-pages-count", message: `Ожидается 35 страниц услуг, получено ${SERVICE_PAGES.length}` });

  const counts = { construction: 0, repair: 0, engineering: 0 };
  let stubs = 0;
  for (const s of SERVICE_PAGES) {
    if (s.isStub) { stubs++; continue; }
    counts[s.category]++;
  }
  if (counts.construction !== 18) issues.push({ rule: "category-count", message: `construction (активных): ожидается 18, получено ${counts.construction}` });
  if (counts.repair !== 11)       issues.push({ rule: "category-count", message: `repair (активных): ожидается 11, получено ${counts.repair}` });
  if (counts.engineering !== 6)   issues.push({ rule: "category-count", message: `engineering (активных): ожидается 6, получено ${counts.engineering}` });
  if (stubs !== 0)                issues.push({ rule: "stub-count", message: `заглушек ожидается 0, получено ${stubs}` });

  // /ukladka-plitki: активная страница с category=repair, без isStub.
  // Стартовая цена startingPriceItemId должна существовать в prices.ts
  // и иметь priceFrom = 2800 (категория tiling).
  const tile = SERVICE_PAGES.find((s) => s.slug === "ukladka-plitki");
  if (!tile) issues.push({ rule: "tile-required", message: "/ukladka-plitki отсутствует в SERVICE_PAGES" });
  else {
    if (tile.category !== "repair") issues.push({ rule: "tile-category", message: `/ukladka-plitki: ожидается category=repair, найдено ${tile.category}` });
    if (tile.isStub === true) issues.push({ rule: "tile-active", message: `/ukladka-plitki: активна, isStub быть не должно` });
    if (!tile.startingPriceItemId) {
      issues.push({ rule: "tile-starting-id", message: "/ukladka-plitki: отсутствует startingPriceItemId" });
    } else {
      const startingItem = PRICES.find((p) => p.id === tile.startingPriceItemId);
      if (!startingItem) issues.push({ rule: "tile-starting-id", message: `/ukladka-plitki: startingPriceItemId ${tile.startingPriceItemId} не найден в prices.ts` });
      else if (startingItem.priceFrom !== 2800) issues.push({ rule: "tile-starting-price", message: `/ukladka-plitki: стартовая позиция должна стоить 2800, найдено ${startingItem.priceFrom}` });
    }
  }
  // Категория tiling — ровно 20 позиций.
  const tilingCount = PRICES.filter((p) => p.category === "tiling").length;
  if (tilingCount !== 20) issues.push({ rule: "tiling-count", message: `tiling: ожидается 20 позиций, найдено ${tilingCount}` });

  const slugs = new Set<string>(); const routes = new Set<string>(); const metas = new Set<string>(); const h1s = new Set<string>();
  for (const s of SERVICE_PAGES) {
    if (slugs.has(s.slug))      issues.push({ id: s.slug, rule: "slug-unique",     message: "Дублирующийся slug" });
    if (routes.has(s.route))    issues.push({ id: s.slug, rule: "route-unique",    message: "Дублирующийся route" });
    if (metas.has(s.metaTitle)) issues.push({ id: s.slug, rule: "meta-unique",     message: "Дублирующийся metaTitle" });
    if (h1s.has(s.h1))          issues.push({ id: s.slug, rule: "h1-unique",       message: "Дублирующийся h1" });
    slugs.add(s.slug); routes.add(s.route); metas.add(s.metaTitle); h1s.add(s.h1);
  }
  return issues;
}

const priceIssues = validatePrices(PRICES);
const pageIssues  = validateServicePages();
const issues = [...priceIssues, ...pageIssues];

const total = PRICES.length;
const byCategory: Record<string, number> = {};
for (const p of PRICES) byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;

console.log(`validate-prices: всего позиций ${total}`);
console.log("по категориям:");
const sum = Object.values(byCategory).reduce((a,b)=>a+b,0);
for (const c of ALL_PRICE_CATEGORIES) console.log(`  ${c}: ${byCategory[c] ?? 0}`);
console.log(`сумма по категориям: ${sum}`);
console.log(`страницы услуг: ${SERVICE_PAGES.length}`);

if (issues.length === 0) {
  console.log("✓ Валидация пройдена.");
  process.exit(0);
}
console.error(`✗ Нарушений: ${issues.length}`);
for (const i of issues) console.error(`  [${i.rule}] ${i.id ?? "-"} — ${i.message}`);
process.exit(1);
