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

// Подэтап 2.5.2 — удалена прежняя inline-запись `ukladka-plitki`
// (была ошибочно отнесена к category="engineering" в 2.1, что давало
// engineeringPagesInServicePages = 7 в аудите 2.5.1). Маршрут /ukladka-plitki
// остаётся RouteStub отдельно от SERVICE_PAGES и подключится в следующем
// разделе ТЗ. После удаления инженерных записей ровно 6.
export const SERVICE_PAGES: ServicePageData[] = [
  ...REPAIR_SERVICE_PAGES,
  ...CONSTRUCTION_SERVICE_PAGES,
  ...ENGINEERING_SERVICE_PAGES,
];

export function getServicePage(slug: string): ServicePageData | undefined {
  return SERVICE_PAGES.find((s) => s.slug === slug);
}

export function getServicesByCategory(category: ServicePageData["category"]): ServicePageData[] {
  return SERVICE_PAGES.filter((s) => s.category === category);
}
