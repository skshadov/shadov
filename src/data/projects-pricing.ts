/**
 * Базовые ставки за м² по материалу строительства — используются для
 * ориентировочной таблицы стоимости в карточке проекта. Синхронизированы
 * с прайсом главной страницы (`home-prices.ts`). Финальная смета считается
 * инженером после выезда и не равна этим цифрам.
 */
export const MATERIAL_RATES = {
  frame: 45000,
  sip: 38000,
  gas: 65000,
  brick: 75000,
} as const;

export type MaterialKey = keyof typeof MATERIAL_RATES;

export const MATERIAL_LABEL: Record<MaterialKey, string> = {
  frame: "Каркас",
  sip: "СИП-панели",
  gas: "Газобетон",
  brick: "Кирпич",
};

export const MATERIAL_LONG_LABEL: Record<MaterialKey, string> = {
  frame: "Каркасный дом под ключ",
  sip: "Дом из СИП-панелей под ключ",
  gas: "Дом из газобетона под ключ",
  brick: "Кирпичный дом под ключ",
};

export const MATERIAL_SERVICE_SLUG: Record<MaterialKey, string> = {
  frame: "karkasnye-doma",
  sip: "doma-iz-sip-paneley",
  gas: "doma-iz-gazobetona",
  brick: "kirpichnye-doma",
};

/** Округление до 10 тыс. ₽ — выглядит как смета, а не калькулятор. */
export function estimateCost(area: number, material: MaterialKey): number {
  return Math.round((area * MATERIAL_RATES[material]) / 10000) * 10000;
}

export function formatRub(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}