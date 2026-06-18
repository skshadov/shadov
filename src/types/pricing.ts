/**
 * Подэтап 2.1A — типы ценовой базы.
 * Все цены — числа, без пробелов и валютного символа. Форматирование только через src/lib/format-price.ts.
 * unitLabel выводится в интерфейсе вместо unit, когда требуется уточнить основание расчёта
 * (например, «м² пола», «м³ бетона»).
 */

export type PriceUnit =
  | "м²"
  | "м³"
  | "пог. м"
  | "шт."
  | "точка"
  | "комплект"
  | "тонна"
  | "месяц"
  | "%"
  | "контур"
  | "отверстие"
  | "контейнер"
  | "модуль";

export type PriceMode =
  | "work"
  | "work_and_basic_materials"
  | "individual";

export type PriceCategory =
  | "repair_packages"
  | "additional_repairs"
  | "house_construction_work"
  | "house_construction_materials"
  | "monolithic"
  | "foundations"
  | "masonry"
  | "roofing"
  | "facades"
  | "general_contracting"
  | "electrical_packages"
  | "electrical"
  | "plumbing_packages"
  | "plumbing"
  | "water_supply"
  | "heating_packages"
  | "heating"
  | "underfloor_heating"
  | "tiling"
  | "finishing_walls"
  | "finishing_floors"
  | "finishing_ceilings"
  | "finishing_doors"
  | "demolition";

export const ALL_PRICE_CATEGORIES: PriceCategory[] = [
  "repair_packages",
  "additional_repairs",
  "house_construction_work",
  "house_construction_materials",
  "monolithic",
  "foundations",
  "masonry",
  "roofing",
  "facades",
  "general_contracting",
  "electrical_packages",
  "electrical",
  "plumbing_packages",
  "plumbing",
  "water_supply",
  "heating_packages",
  "heating",
  "underfloor_heating",
  "tiling",
  "finishing_walls",
  "finishing_floors",
  "finishing_ceilings",
  "finishing_doors",
  "demolition",
];

export type PriceItem = {
  id: string;
  category: PriceCategory;
  serviceSlug?: string;
  name: string;
  unit?: PriceUnit;
  unitLabel?: string;
  priceFrom?: number;
  priceTo?: number;
  percentageFrom?: number;
  percentageTo?: number;
  priceLabel?: string;
  mode: PriceMode;
  note?: string;
  materialsIncluded: boolean;
  actualDate: "2026-06";
  sortOrder: number;
};

export const PRICE_ACTUAL_DATE = "2026-06" as const;

export const PRICE_CATEGORY_LABELS: Record<PriceCategory, string> = {
  repair_packages: "Пакеты комплексного ремонта",
  additional_repairs: "Дополнительные варианты ремонта",
  house_construction_work: "Строительство домов — только работы",
  house_construction_materials: "Строительство домов — работы и базовые материалы",
  monolithic: "Монолитные работы",
  foundations: "Фундаменты",
  masonry: "Кладочные работы",
  roofing: "Кровельные работы",
  facades: "Фасадные работы",
  general_contracting: "Генеральный подряд",
  electrical_packages: "Пакеты электромонтажа",
  electrical: "Отдельные электромонтажные работы",
  plumbing_packages: "Пакеты сантехнических работ",
  plumbing: "Отдельные сантехнические работы",
  water_supply: "Водоснабжение и канализация частного дома",
  heating_packages: "Пакеты отопления",
  heating: "Отдельные работы по отоплению",
  underfloor_heating: "Тёплый пол",
  tiling: "Плиточные работы",
  finishing_walls: "Стены — отделочные работы",
  finishing_floors: "Полы — отделочные работы",
  finishing_ceilings: "Потолки — отделочные работы",
  finishing_doors: "Двери — установка и обвязка",
  demolition: "Демонтажные работы",
};
