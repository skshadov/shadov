/**
 * Единый источник цен для посадочных страниц, сводного прайса и калькулятора.
 * Принцип: никаких «от». Базовая цена указывается с условиями, все надбавки —
 * отдельными строками с конкретными цифрами.
 */

export interface PriceRow {
  /** Наименование позиции понятным языком */
  name: string;
  /** Единица измерения: м², м.п., точка, шт., объект */
  unit: string;
  /** Цена работы, ₽ */
  work: number | null;
  /** Цена материала, ₽ (null — материал заказчика или не требуется) */
  material: number | null;
  /** Пояснение простым языком: что именно входит в позицию */
  note?: string;
}

export interface PriceGroup {
  title: string;
  /** Подпись под заголовком группы */
  caption?: string;
  rows: PriceRow[];
}

export interface PackageOffer {
  title: string;
  subtitle: string;
  scope: string[];
  workTotal: number;
  turnkeyTotal: number;
  term: string;
}

export interface CalcOption {
  id: string;
  label: string;
  /** Прибавка к цене под ключ, ₽ за единицу расчёта */
  addTurnkey: number;
  hint?: string;
  /** Привязка к позиции прайса */
  priceRowKey?: string;
  /**
   * Как считать надбавку из привязанной позиции прайса:
   * "add" (по умолчанию) — цена позиции прибавляется целиком (отдельная работа);
   * "delta" — позиция заменяет базовую работу, берётся разница цен.
   */
  priceMode?: "add" | "delta";
  /** Множитель для позиций «за каждые 10 мм» и подобных */
  priceMultiplier?: number;
}

export interface CalcConfig {
  /** Что считаем: площадь в м², метраж трасс или штуки */
  unit: "м²" | "м.п." | "шт.";
  unitLabel: string;
  defaultQty: number;
  minQty: number;
  maxQty: number;
  /** Базовая цена работы за единицу */
  baseWork: number;
  /** Привязка базовой цены к позиции прайса */
  baseRowKey?: string;
  /** Базовая цена материала за единицу */
  baseMaterial: number;
  options: CalcOption[];
  /** Надбавка за малый объём: если меньше порога — прибавка за единицу */
  smallVolume?: { threshold: number; add: number };
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ServicePricing {
  slug: string;
  path: string;
  /** Короткое имя для меню и карточек */
  shortName: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  /** Одно предложение — что делаем и для кого */
  lead: string;
  /** Заголовок цены на первом экране, например «740–1 100 ₽/м² под ключ» */
  priceHeadline: string;
  priceHeadlineNote: string;
  /** Условия, при которых действует базовая цена */
  baseConditions: string[];
  /** Что конкретно входит в базовую цену за единицу — построчно, без «и т. д.» */
  baseIncludes?: string[];
  groups: PriceGroup[];
  included: string[];
  excluded: string[];
  packages?: PackageOffer[];
  stages: Array<{ title: string; text: string; term: string }>;
  conditions: string[];
  guarantee: string;
  faq: FaqItem[];
  calc: CalcConfig;
}

export function formatRub(value: number): string {
  return value.toLocaleString("ru-RU").replace(/\u00A0/g, " ") + " ₽";
}