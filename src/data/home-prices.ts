/**
 * Стартовые цены на главной — значения синхронизированы с src/data/pricing.
 */
export interface StartingPrice {
  service: string;
  price: string;
  to: string;
}

export const HOME_STARTING_PRICES: StartingPrice[] = [
  { service: "Механизированная штукатурка", price: "550 ₽/м² за работу", to: "/mekhanizirovannaya-shtukaturka" },
  { service: "Мокрая стяжка пола", price: "550 ₽/м² за работу", to: "/styazhka-pola" },
  { service: "Полусухая стяжка пола", price: "450 ₽/м² за работу", to: "/polusuhaya-styazhka" },
  { service: "Водяной тёплый пол", price: "700 ₽/м² за работу", to: "/teplyy-pol" },
  { service: "Электрика, проводка по полу", price: "350 ₽/м.п. за работу", to: "/razvodka-elektriki" },
  { service: "Сантехника, труба ХВС/ГВС", price: "700 ₽/м.п. за работу", to: "/razvodka-santehniki" },
  { service: "Сантехника, канализация Ø40–50", price: "700 ₽/м.п. за работу", to: "/razvodka-santehniki" },
];

/** Краткая оговорка по ценам. */
export const PRICES_WORK_ONLY_NOTE = "Цены не являются публичной офертой.";

/** Дата актуализации цен на главной. */
export const PRICES_ACTUAL_DATE = "Август 2026 года";
