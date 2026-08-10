/**
 * Калькулятор считает по актуальной таблице прайса.
 * Базовая цена берётся из позиции прайса, к которой привязан калькулятор,
 * надбавки опций — из привязанных позиций (разница с базовой ценой).
 */
import type { ServicePricing, PriceRow } from "./types";

export interface PriceRowRef {
  key: string;
  label: string;
  work: number;
  unit: string;
}

/** Стабильный ключ позиции прайса: название группы + название позиции. */
export function priceRowKey(groupTitle: string, rowName: string): string {
  return `${groupTitle}::${rowName}`;
}

/** Все позиции прайса с ценой работы — для привязки в админке. */
export function listPriceRowRefs(pricing: ServicePricing): PriceRowRef[] {
  const refs: PriceRowRef[] = [];
  for (const g of pricing.groups) {
    for (const r of g.rows) {
      if (typeof r.work === "number") {
        refs.push({ key: priceRowKey(g.title, r.name), label: `${g.title} — ${r.name}`, work: r.work, unit: r.unit });
      }
    }
  }
  return refs;
}

function findRow(pricing: ServicePricing, key?: string): PriceRow | undefined {
  if (!key) return undefined;
  for (const g of pricing.groups) {
    for (const r of g.rows) {
      if (priceRowKey(g.title, r.name) === key && typeof r.work === "number") return r;
    }
  }
  return undefined;
}

/** Первая позиция прайса с ценой работы — базовая по умолчанию. */
function firstRowWithWork(pricing: ServicePricing): PriceRow | undefined {
  for (const g of pricing.groups) {
    for (const r of g.rows) if (typeof r.work === "number") return r;
  }
  return undefined;
}

/**
 * Пересчитывает калькулятор по актуальному прайсу.
 * Если привязки нет — берётся первая позиция прайса.
 */
export function syncCalcWithPrices(pricing: ServicePricing): ServicePricing {
  const baseRow = findRow(pricing, pricing.calc.baseRowKey) ?? firstRowWithWork(pricing);
  const baseWork = typeof baseRow?.work === "number" ? baseRow.work : pricing.calc.baseWork;

  const options = pricing.calc.options.map((o) => {
    const row = findRow(pricing, o.priceRowKey);
    if (!row || typeof row.work !== "number") return o;
    return { ...o, addTurnkey: Math.max(0, row.work - baseWork) };
  });

  return { ...pricing, calc: { ...pricing.calc, baseWork, options } };
}
