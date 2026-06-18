/**
 * Подэтап 2.1 — сборка полной модели страницы услуги из источников данных.
 */
import { getServicePage } from "@/data/service-pages";
import { getPricesByCategory } from "@/data/prices";
import { getFaqByIds } from "@/data/service-faq";
import { getRepairPackage } from "@/data/repair-packages";
import type { ServicePageData, ServiceFaqItem } from "@/types/services";
import type { PriceItem } from "@/types/pricing";
import type { RepairPackage } from "@/data/repair-packages";

/**
 * Подэтап 2.4.2A — список slug'ов строительных страниц, для которых
 * `ConstructionServicePage` уже подключён к маршруту. Остальные восемь
 * строительных маршрутов остаются `RouteStub` и не должны попадать в блок
 * «Связанные услуги» как готовые услуги.
 */
export const ACTIVE_CONSTRUCTION_SLUGS = new Set<string>([
  "stroitelstvo",
  "stroitelstvo-domov-pod-klyuch",
  "karkasnye-doma",
  "doma-iz-sip-paneley",
  "doma-iz-brusa",
  "doma-iz-kleenogo-brusa",
  "doma-iz-gazobetona",
  "doma-iz-keramicheskih-blokov",
  "kirpichnye-doma",
  "monolitnye-doma",
  "kombinirovannye-doma",
  "mnogokvartirnye-doma",
  "generalnyy-podryad",
  "monolitnye-raboty",
  "fundamenty",
  "kladochnye-raboty",
  "krovelnye-raboty",
  "fasadnye-raboty",
]);

/**
 * Категория считается активной, если у страницы есть заполненный контент
 * (included/stages непустые). Для строительства дополнительно требуется
 * принадлежность к ACTIVE_CONSTRUCTION_SLUGS, поскольку 8 заглушек ещё
 * подключаются на следующих подэтапах.
 */
function isActiveServicePage(p: ServicePageData): boolean {
  if (p.included.length === 0 || p.stages.length === 0) return false;
  if (p.category === "construction") return ACTIVE_CONSTRUCTION_SLUGS.has(p.slug);
  return true;
}

export type ResolvedServicePage = {
  data: ServicePageData;
  prices: PriceItem[];
  faq: ServiceFaqItem[];
  packages: RepairPackage[];
  related: ServicePageData[];
};

export function resolveServicePage(slug: string): ResolvedServicePage | undefined {
  const data = getServicePage(slug);
  if (!data) return undefined;

  const prices = data.priceCategoryIds.flatMap((c) => getPricesByCategory(c));
  const faq = getFaqByIds(data.faqIds);
  const packages = (data.packages ?? [])
    .map(getRepairPackage)
    .filter((p): p is RepairPackage => Boolean(p));
  const related = data.relatedSlugs
    .map(getServicePage)
    .filter((p): p is ServicePageData => Boolean(p))
    .filter(isActiveServicePage);

  return { data, prices, faq, packages, related };
}
