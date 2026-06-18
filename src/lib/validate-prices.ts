/**
 * Подэтап 2.1 — валидатор базы цен.
 * Запуск: bun src/lib/validate-prices.ts
 * Возвращает код 0 при успехе, 1 при найденных нарушениях.
 */
import { PRICES } from "@/data/prices";
import type { PriceItem } from "@/types/pricing";

type Issue = { id?: string; rule: string; message: string };

function validate(items: PriceItem[]): Issue[] {
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

    if (p.percentageFrom !== undefined && p.percentageFrom <= 0) issues.push({ id: p.id, rule: "no-zero-pct", message: "Нулевой или отрицательный percentageFrom" });
    if (p.percentageTo !== undefined && p.percentageTo <= 0) issues.push({ id: p.id, rule: "no-zero-pct", message: "Нулевой или отрицательный percentageTo" });
    if (p.percentageFrom !== undefined && p.percentageTo !== undefined && p.percentageFrom > p.percentageTo)
      issues.push({ id: p.id, rule: "pct-range-order", message: "percentageFrom > percentageTo" });

    if (p.priceFrom !== undefined && p.percentageFrom !== undefined)
      issues.push({ id: p.id, rule: "exclusive", message: "Одновременно priceFrom и percentageFrom" });

    if ((p.priceFrom !== undefined || p.percentageFrom !== undefined) && p.priceLabel)
      issues.push({ id: p.id, rule: "exclusive-label", message: "Одновременно числовая цена и priceLabel" });

    if (p.priceFrom !== undefined && !p.unit)
      issues.push({ id: p.id, rule: "unit-required", message: "Числовая цена без единицы измерения" });

    if (p.materialsIncluded && p.category !== "house_construction_materials")
      issues.push({ id: p.id, rule: "materials-flag", message: "materialsIncluded=true вне таблицы домов с базовыми материалами" });

    const serialized = JSON.stringify(p);
    if (serialized.includes("undefined")) issues.push({ id: p.id, rule: "undefined", message: "undefined в сериализованных данных" });
    if (/lorem ipsum/i.test(serialized)) issues.push({ id: p.id, rule: "lorem", message: "Lorem ipsum в данных" });
  }

  return issues;
}

const issues = validate(PRICES);
const total = PRICES.length;
const byCategory: Record<string, number> = {};
for (const p of PRICES) byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;

console.log(`validate-prices: всего позиций ${total}`);
console.log("по категориям:");
for (const [k, v] of Object.entries(byCategory).sort()) console.log(`  ${k}: ${v}`);

if (issues.length === 0) {
  console.log("✓ Валидация пройдена.");
  process.exit(0);
}

console.error(`✗ Найдено нарушений: ${issues.length}`);
for (const i of issues) console.error(`  [${i.rule}] ${i.id ?? "-"} — ${i.message}`);
process.exit(1);
