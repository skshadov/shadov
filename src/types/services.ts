/**
 * Подэтап 2.1 — типы записей страниц услуг.
 * Запрещено добавлять: конкретные сроки объекта, гарантии, выполненные объекты,
 * статистику компании, фамилии сотрудников, реквизиты, отзывы.
 */

import type { PriceCategory } from "./pricing";

export type ServiceCategory = "construction" | "repair" | "engineering";

export type ServiceFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type ServicePageData = {
  slug: string;
  route: string;
  category: ServiceCategory;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  description: string;
  startingPrice?: string;
  suitableFor: string[];
  benefits: string[];
  included: string[];
  excluded: string[];
  packages?: string[];
  technology: string[];
  stages: string[];
  qualityControl: string[];
  documents: string[];
  timelineFactors: string[];
  priceCategoryIds: PriceCategory[];
  faqIds: string[];
  relatedSlugs: string[];
  illustrationKey?: string;
  /**
   * Подэтап 2.3A — явный перечень ID позиций из prices.ts для блока «Пример
   * структуры сметы». Автоматический выбор первых строк категории запрещён.
   */
  estimateExampleItemIds?: string[];
  /**
   * Подэтап 2.3A — демонстрационные объёмы по ID позиции. Объём всегда
   * подписан в интерфейсе как «Демонстрационный объём».
   */
  estimateExampleVolumes?: Record<
    string,
    { value: number; label: "Демонстрационный объём" }
  >;
  /**
   * Подэтап 2.3A — необязательные пометки для отдельных строк примера
   * (например, «Вариант отделки»).
   */
  estimateExampleNotes?: Record<string, string>;
};
