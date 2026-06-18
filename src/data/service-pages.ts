/**
 * Подэтап 2.1 — каркас данных страниц услуг.
 * На текущем подэтапе фиксируются: маршрут, slug, категория, базовые SEO-поля,
 * стартовая цена (если утверждена), ссылки на ценовые категории и FAQ.
 * Полные массивы included/excluded/stages/qualityControl/documents/timelineFactors
 * заполняются дословно из соответствующих разделов ТЗ перед подэтапами 2.3–2.5.
 */

import type { ServicePageData } from "@/types/services";
import { REPAIR_SERVICE_PAGES } from "./service-pages-repair";
import { CONSTRUCTION_SERVICE_PAGES } from "./service-pages-construction";
import { ENGINEERING_SERVICE_PAGES } from "./service-pages-engineering";

function empty<T>(): T[] {
  return [] as T[];
}

export const SERVICE_PAGES: ServicePageData[] = [
  // ── Ремонт ────────────────────────────────────────────────────────────────
  ...REPAIR_SERVICE_PAGES,

  // ── Строительство (подэтап 2.4.1 — полные данные 18 страниц) ─────────────
  ...CONSTRUCTION_SERVICE_PAGES,

  // ── Инженерные системы (подэтап 2.5.1 — 6 страниц, маршруты остаются RouteStub) ──
  ...ENGINEERING_SERVICE_PAGES,

  { slug: "ukladka-plitki", route: "/ukladka-plitki", category: "engineering",
    title: "Укладка плитки", metaTitle: "Укладка плитки и керамогранита — Шадов и партнёры",
    metaDescription: "Стандартная плитка, керамогранит, крупный формат и плиты до 3200 мм, мозаика, диагональ, ёлочка, запил 45°.",
    h1: "Укладка плитки", description: "Все виды плиточных работ с гидроизоляцией и контролем оснований.",
    startingPrice: "от 2 800 ₽/м²",
    suitableFor: empty(), benefits: empty(), included: empty(), excluded: empty(),
    technology: empty(), stages: empty(), qualityControl: empty(), documents: empty(), timelineFactors: empty(),
    priceCategoryIds: ["tiling"], faqIds: ["contract-price", "hidden-works"], relatedSlugs: ["chistovaya-otdelka", "santehnika", "teplyy-pol"],
  },
];

export function getServicePage(slug: string): ServicePageData | undefined {
  return SERVICE_PAGES.find((s) => s.slug === slug);
}

export function getServicesByCategory(category: ServicePageData["category"]): ServicePageData[] {
  return SERVICE_PAGES.filter((s) => s.category === category);
}
