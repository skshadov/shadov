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
  legalName: "" as string,                  // Полное юр. наименование
  brandName: "Шадов и партнёры" as string,  // Можно использовать — это название бренда
  brandFull: "Строительная компания «Шадов и партнёры»" as string,
  domain: "shadov.pro" as string,
  inn: "" as string,
  ogrn: "" as string,
  kpp: "" as string,
  legalAddress: "" as string,
  officeAddress: "" as string,
  phone: "" as string,
  phoneE164: "" as string,
  email: "" as string,
  telegram: "" as string,
  whatsapp: "" as string,
  workingHours: "" as string,
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