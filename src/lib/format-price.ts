/**
 * Подэтап 2.1 — форматирование цен. Локаль ru-RU, неразрывный пробел между разрядами.
 * Слово «от» добавляется только если в исходных данных одно значение priceFrom без диапазона.
 * Никогда не добавлять «от» дважды, не выводить 0/undefined/пустую валюту.
 */
import type { PriceItem, PriceUnit } from "@/types/pricing";

const NBSP = "\u00A0";

function spaceThousands(value: number): string {
  // ru-RU группировка → 18 000; заменяем стандартный пробел на NBSP, чтобы число не переносилось.
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value).replace(/\s/g, NBSP);
}

/** 18000 → "18 000 ₽" (без слова «от», без единицы). */
export function formatRubles(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return `${spaceThousands(value)}${NBSP}₽`;
}

/** "от 5%" / "от 5–10%". */
export function formatPercentage(min: number, max?: number): string {
  if (!Number.isFinite(min) || min <= 0) return "";
  const left = `${min}%`;
  if (max && max > min) return `от${NBSP}${min}–${max}%`;
  return `от${NBSP}${left}`;
}

function unitSuffix(unit?: PriceUnit): string {
  if (!unit) return "";
  if (unit === "%") return "";
  if (unit === "месяц") return `/${unit}`;
  return `/${unit}`;
}

/** Универсальный форматтер строки прайса. */
export function formatPriceItem(item: PriceItem): string {
  if (item.priceLabel) return item.priceLabel;

  if (typeof item.percentageFrom === "number") {
    const base = formatPercentage(item.percentageFrom, item.percentageTo);
    if (!base) return "";
    // Утверждённая формулировка для генподряда — «… стоимости СМР» добавляется в данных через note.
    return base;
  }

  if (typeof item.priceFrom === "number" && item.priceFrom > 0) {
    const base = `от${NBSP}${spaceThousands(item.priceFrom)}${NBSP}₽${unitSuffix(item.unit)}`;
    if (typeof item.priceTo === "number" && item.priceTo > item.priceFrom) {
      // Утверждённые диапазоны — например, в калькуляторе через коэффициенты.
      return `от${NBSP}${spaceThousands(item.priceFrom)}${NBSP}до${NBSP}${spaceThousands(item.priceTo)}${NBSP}₽${unitSuffix(item.unit)}`;
    }
    return base;
  }

  return "";
}

/** Дата актуализации в человекочитаемом виде. */
export function formatActualDate(date: "2026-06"): string {
  if (date === "2026-06") return "Июнь 2026 года";
  return date;
}
