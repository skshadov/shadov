/**
 * Подэтап 2.1A — форматирование цен. Локаль ru-RU, неразрывный пробел между разрядами.
 * При наличии unitLabel в данных он используется в интерфейсе вместо общей PriceUnit.
 */
import type { PriceItem, PriceUnit } from "@/types/pricing";

const NBSP = "\u00A0";

function spaceThousands(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value).replace(/\s/g, NBSP);
}

export function formatRubles(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return `${spaceThousands(value)}${NBSP}₽`;
}

export function formatPercentage(min: number, max?: number): string {
  if (!Number.isFinite(min) || min <= 0) return "";
  if (max && max > min) return `от${NBSP}${min}–${max}%`;
  return `от${NBSP}${min}%`;
}

function unitSuffix(item: PriceItem): string {
  const label = item.unitLabel ?? item.unit;
  if (!label) return "";
  if (label === "%") return "";
  return `/${label}`;
}

export function getUnitDisplay(item: PriceItem): string {
  return item.unitLabel ?? item.unit ?? "—";
}

export function formatPriceItem(item: PriceItem): string {
  if (item.priceLabel) return item.priceLabel;

  if (typeof item.percentageFrom === "number") {
    return formatPercentage(item.percentageFrom, item.percentageTo);
  }

  if (typeof item.priceFrom === "number" && item.priceFrom > 0) {
    const left = `от${NBSP}${spaceThousands(item.priceFrom)}${NBSP}₽${unitSuffix(item)}`;
    if (typeof item.priceTo === "number" && item.priceTo > item.priceFrom) {
      return `от${NBSP}${spaceThousands(item.priceFrom)}${NBSP}до${NBSP}${spaceThousands(item.priceTo)}${NBSP}₽${unitSuffix(item)}`;
    }
    return left;
  }

  return "";
}

export function formatActualDate(date: "2026-06"): string {
  if (date === "2026-06") return "Июнь 2026 года";
  return date;
}

// Утилита экспортируется для возможных списков допустимых единиц.
export const KNOWN_UNITS: PriceUnit[] = [
  "м²","м³","пог. м","шт.","точка","комплект","тонна","месяц","%","контур","отверстие","контейнер","модуль",
];
