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
  { service: "Электрика, точка", price: "1 100 ₽ за работу", to: "/razvodka-elektriki" },
  { service: "Сантехника, точка воды", price: "2 400 ₽ за работу", to: "/razvodka-santehniki" },
  { service: "Сантехника, точка канализации", price: "2 200 ₽ за работу", to: "/razvodka-santehniki" },
];

/** Общая оговорка по ценам: только работа, материалы — заказчика. */
export const PRICES_WORK_ONLY_NOTE =
  "Все цены указаны только за работу. Материалы заказчик выбирает и покупает сам; при необходимости мы закупим и доставим их — стоимость обсуждается отдельно.";

/** Дата актуализации цен на главной. */
export const PRICES_ACTUAL_DATE = "Август 2026 года";
