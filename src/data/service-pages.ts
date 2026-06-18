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

function empty<T>(): T[] {
  return [] as T[];
}

export const SERVICE_PAGES: ServicePageData[] = [
  // ── Ремонт ────────────────────────────────────────────────────────────────
  ...REPAIR_SERVICE_PAGES,

  // ── Строительство (подэтап 2.4.1 — полные данные 18 страниц) ─────────────
  ...CONSTRUCTION_SERVICE_PAGES,

  // ── Инженерные системы ───────────────────────────────────────────────────
  { slug: "inzhenernye-sistemy", route: "/inzhenernye-sistemy", category: "engineering",
    title: "Инженерные системы", metaTitle: "Инженерные системы — Шадов и партнёры",
    metaDescription: "Электромонтаж, сантехника, водоснабжение и канализация, отопление, тёплый пол.",
    h1: "Инженерные системы", description: "Проектирование, монтаж и пусконаладка инженерных систем.",
    suitableFor: empty(), benefits: empty(), included: empty(), excluded: empty(),
    technology: empty(), stages: empty(), qualityControl: empty(), documents: empty(), timelineFactors: empty(),
    priceCategoryIds: ["electrical_packages", "plumbing_packages", "heating_packages", "water_supply", "underfloor_heating"],
    faqIds: ["contract-price", "hidden-works"],
    relatedSlugs: ["elektromontazh", "santehnika", "otoplenie", "teplyy-pol", "vodosnabzhenie-kanalizatsiya"],
  },
  { slug: "elektromontazh", route: "/elektromontazh", category: "engineering",
    title: "Электромонтаж", metaTitle: "Электромонтаж под ключ — Шадов и партнёры",
    metaDescription: "Три пакета электромонтажа: базовый, стандарт, премиум. Проект, монтаж, измерения, исполнительные схемы.",
    h1: "Электромонтаж", description: "Полный комплекс электромонтажных работ от обследования до пусконаладки.",
    startingPrice: "от 2 500 ₽/м²",
    suitableFor: empty(), benefits: empty(), included: empty(), excluded: empty(),
    technology: empty(), stages: empty(), qualityControl: empty(), documents: empty(), timelineFactors: empty(),
    priceCategoryIds: ["electrical_packages", "electrical"], faqIds: ["contract-price", "hidden-works", "documents-handover"],
    relatedSlugs: ["santehnika", "otoplenie", "teplyy-pol"],
  },
  { slug: "santehnika", route: "/santehnika", category: "engineering",
    title: "Сантехника", metaTitle: "Сантехнические работы — Шадов и партнёры",
    metaDescription: "Комплексные пакеты сантехники по квартире и отдельные точки. Опрессовка, скрытые работы по актам.",
    h1: "Сантехнические работы", description: "Сантехнические системы для квартир и домов.",
    suitableFor: empty(), benefits: empty(), included: empty(), excluded: empty(),
    technology: empty(), stages: empty(), qualityControl: empty(), documents: empty(), timelineFactors: empty(),
    priceCategoryIds: ["plumbing_packages", "plumbing"], faqIds: ["contract-price", "hidden-works"],
    relatedSlugs: ["vodosnabzhenie-kanalizatsiya", "otoplenie", "teplyy-pol"],
  },
  { slug: "vodosnabzhenie-kanalizatsiya", route: "/vodosnabzhenie-kanalizatsiya", category: "engineering",
    title: "Водоснабжение и канализация", metaTitle: "Водоснабжение и канализация частного дома — Шадов и партнёры",
    metaDescription: "Скважины, насосные станции, очистные сооружения, наружные и внутренние сети.",
    h1: "Водоснабжение и канализация частного дома", description: "Полный комплекс работ по водоснабжению и водоотведению дома.",
    suitableFor: empty(), benefits: empty(), included: empty(), excluded: empty(),
    technology: empty(), stages: empty(), qualityControl: empty(), documents: empty(), timelineFactors: empty(),
    priceCategoryIds: ["water_supply"], faqIds: ["contract-price", "hidden-works"], relatedSlugs: ["santehnika", "otoplenie"],
  },
  { slug: "otoplenie", route: "/otoplenie", category: "engineering",
    title: "Отопление", metaTitle: "Отопление частного дома и квартиры — Шадов и партнёры",
    metaDescription: "Теплотехнический расчёт, котельная, радиаторы, тёплый пол, автоматика, опрессовка, балансировка.",
    h1: "Отопление", description: "Системы отопления с полным циклом расчёта, монтажа и пусконаладки.",
    suitableFor: empty(), benefits: empty(), included: empty(), excluded: empty(),
    technology: empty(), stages: empty(), qualityControl: empty(), documents: empty(), timelineFactors: empty(),
    priceCategoryIds: ["heating_packages", "heating"], faqIds: ["contract-price", "hidden-works"],
    relatedSlugs: ["teplyy-pol", "santehnika", "vodosnabzhenie-kanalizatsiya"],
  },
  { slug: "teplyy-pol", route: "/teplyy-pol", category: "engineering",
    title: "Тёплый пол", metaTitle: "Тёплый пол — Шадов и партнёры",
    metaDescription: "Электрический и водяной тёплый пол с проектом, монтажом и пусконаладкой.",
    h1: "Тёплый пол", description: "Электрические и водяные системы тёплого пола.",
    suitableFor: empty(), benefits: empty(), included: empty(), excluded: empty(),
    technology: empty(), stages: empty(), qualityControl: empty(), documents: empty(), timelineFactors: empty(),
    priceCategoryIds: ["underfloor_heating"], faqIds: ["contract-price", "hidden-works"],
    relatedSlugs: ["otoplenie", "ukladka-plitki", "elektromontazh"],
  },
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
