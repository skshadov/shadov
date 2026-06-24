/**
 * Единый источник реквизитов и контактов «Шадов и партнёры».
 * На Этапе 1 все значения — пустые плейсхолдеры. Эти поля
 * заполняются через административную панель на Этапе 5.
 *
 * UI обязан использовать helper isFilled(value): пустые поля
 * скрываются, чтобы публично не выводить undefined / null /
 * "[телефон]" / "0000000000" и т. п.
 */
export const company = {
  legalName: "ООО \"СК ШАДОВ И ПАРТНЕРЫ\"" as string,                  // Полное юр. наименование
  brandName: "Шадов и партнёры" as string,  // Можно использовать — это название бренда
  brandFull: "Строительная компания «Шадов и партнёры»" as string,
  domain: "shadov.pro" as string,
  inn: "123456789" as string,
  ogrn: "123456789" as string,
  kpp: "" as string,
  legalAddress: "Московская область, Мытищи, улица Белобородова, вл2Б" as string,
  officeAddress: "Московская область, г. Мытищи, ул. Белобородова, вл. 2Б" as string,
  phone: "+7 (926) 092-02-21" as string,
  phoneE164: "+79260920221" as string,
  email: "info@shadov.pro" as string,
  telegram: "https://t.me/+79260920221" as string,
  whatsapp: "https://wa.me/79260920221" as string,
  max: "https://max.ru/+79260920221" as string,
  workingHours: "Пн–Пт, 9:00–18:00" as string,
  sroName: "" as string,
  sroNumber: "" as string,
  sroRegistryUrl: "" as string,
  yearsOnMarket: "" as string,
  staffCount: "" as string,
  projectsCount: "" as string,
  warrantyYears: "" as string,
} as const;

/** Регионы работы (§1) — это не выдумка, а текст ТЗ. */
export const regions = [
  "Москва",
  "Московская область",
  "Другие регионы — по отдельному согласованию",
];

/** Проверка, заполнено ли поле плейсхолдером. */
export function isFilled(value: string | undefined | null): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  // Технические значения, которые ни в коем случае не должны утечь в UI
  const forbidden = ["undefined", "null", "[телефон]", "[ИНН]", "0000000000", "n/a"];
  return !forbidden.includes(trimmed.toLowerCase());
}