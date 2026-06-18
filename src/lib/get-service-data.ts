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
    .filter((p): p is ServicePageData => Boolean(p));

  return { data, prices, faq, packages, related };
}
