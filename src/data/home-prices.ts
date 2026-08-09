/**
 * Стартовые цены на главной — значения синхронизированы с src/data/pricing.
 */
export interface StartingPrice {
  service: string;
  price: string;
  to: string;
}

export const HOME_STARTING_PRICES: StartingPrice[] = [
  { service: "Механизированная штукатурка", price: "550 ₽/м² работа, 740 ₽/м² под ключ", to: "/mekhanizirovannaya-shtukaturka" },
  { service: "Мокрая стяжка пола", price: "550 ₽/м² работа, 810 ₽/м² под ключ", to: "/styazhka-pola" },
  { service: "Водяной тёплый пол", price: "1 950 ₽/м² под ключ со стяжкой", to: "/teplyy-pol" },
  { service: "Электрика, точка", price: "950 ₽ работа, 1 450 ₽ под ключ", to: "/razvodka-elektriki" },
  { service: "Сантехника, точка воды", price: "2 600 ₽ работа, 3 900 ₽ под ключ", to: "/razvodka-santehniki" },
  { service: "Сантехника, точка канализации", price: "2 400 ₽ работа, 3 500 ₽ под ключ", to: "/razvodka-santehniki" },
];

/** Дата актуализации цен на главной. */
export const PRICES_ACTUAL_DATE = "Август 2026 года";
