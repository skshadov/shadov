/**
 * Подэтап 2.1 — единый источник утверждённых цен.
 *
 * Правила:
 * - Все значения — числа, без пробелов и символа ₽. Форматирование через src/lib/format-price.ts.
 * - actualDate всех позиций — "2026-06".
 * - ID уникальны и стабильны (имя сервиса + уровень). Менять ID нельзя — на них ссылаются страницы.
 * - materialsIncluded=true ТОЛЬКО для категории house_construction_materials (утверждённая таблица).
 * - Категории, для которых исходные построчные таблицы ТЗ не были переданы в текущей итерации,
 *   оставлены пустыми массивами. Они будут наполнены дословно перед подэтапом 2.2.
 */

import type { PriceItem } from "@/types/pricing";

// ───────────────────────────────────────────────────────────────────────────────
// 1. ПАКЕТЫ КОМПЛЕКСНОГО РЕМОНТА — §6 запроса.
// ───────────────────────────────────────────────────────────────────────────────
const REPAIR_PACKAGES: PriceItem[] = [
  { id: "repair-cosmetic", category: "repair_packages", serviceSlug: "kosmeticheskiy-remont", name: "Косметический ремонт", unit: "м²", priceFrom: 6500, mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 1 },
  { id: "repair-econom", category: "repair_packages", serviceSlug: "ekonom-remont", name: "Эконом-ремонт", unit: "м²", priceFrom: 12000, mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 2 },
  { id: "repair-standard", category: "repair_packages", serviceSlug: "standartnyy-remont", name: "Стандартный ремонт", unit: "м²", priceFrom: 18000, mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 3 },
  { id: "repair-euro", category: "repair_packages", serviceSlug: "evroremont", name: "Евроремонт / комфорт", unit: "м²", priceFrom: 25000, mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 4 },
  { id: "repair-business", category: "repair_packages", serviceSlug: "biznes-remont", name: "Бизнес-ремонт", unit: "м²", priceFrom: 35000, mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 5 },
  { id: "repair-premium", category: "repair_packages", serviceSlug: "premialnyy-remont", name: "Премиальный ремонт", unit: "м²", priceFrom: 48000, mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 6 },
  { id: "repair-exclusive", category: "repair_packages", serviceSlug: "remont-pod-klyuch", name: "Эксклюзивный ремонт", unit: "м²", priceFrom: 65000, mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 7, note: "Размещается как пакет на /remont-pod-klyuch и /prices" },
];

// ───────────────────────────────────────────────────────────────────────────────
// 2. ДОПОЛНИТЕЛЬНЫЕ ВАРИАНТЫ РЕМОНТА — наполняется перед подэтапом 2.3 из §13 ТЗ.
// ───────────────────────────────────────────────────────────────────────────────
const ADDITIONAL_REPAIRS: PriceItem[] = [];

// ───────────────────────────────────────────────────────────────────────────────
// 3. СТРОИТЕЛЬСТВО ДОМОВ — ТОЛЬКО РАБОТЫ (§7 запроса, утверждённая таблица).
//    Уровни: shell / warmShell / preFinish / turnkey.
// ───────────────────────────────────────────────────────────────────────────────
type HouseRow = { slug: string; name: string; shell: number; warmShell: number; preFinish: number; turnkey: number; turnkeyMaterials: number; sort: number };
const HOUSE_ROWS: HouseRow[] = [
  { slug: "karkasnye-doma",                name: "Каркасный дом",                shell: 18000, warmShell: 26000, preFinish: 36000, turnkey: 45000, turnkeyMaterials: 95000,  sort: 1 },
  { slug: "doma-iz-sip-paneley",           name: "Дом из СИП-панелей",            shell: 17000, warmShell: 25000, preFinish: 35000, turnkey: 44000, turnkeyMaterials: 90000,  sort: 2 },
  { slug: "doma-iz-brusa",                 name: "Дом из профилированного бруса", shell: 20000, warmShell: 28000, preFinish: 38000, turnkey: 48000, turnkeyMaterials: 105000, sort: 3 },
  { slug: "doma-iz-kleenogo-brusa",        name: "Дом из клееного бруса",         shell: 24000, warmShell: 34000, preFinish: 46000, turnkey: 58000, turnkeyMaterials: 125000, sort: 4 },
  { slug: "doma-iz-gazobetona",            name: "Дом из газобетона",             shell: 25000, warmShell: 36000, preFinish: 50000, turnkey: 65000, turnkeyMaterials: 125000, sort: 5 },
  { slug: "doma-iz-keramicheskih-blokov",  name: "Дом из керамических блоков",    shell: 28000, warmShell: 40000, preFinish: 55000, turnkey: 72000, turnkeyMaterials: 145000, sort: 6 },
  { slug: "kirpichnye-doma",               name: "Кирпичный дом",                 shell: 32000, warmShell: 45000, preFinish: 62000, turnkey: 80000, turnkeyMaterials: 165000, sort: 7 },
  { slug: "monolitnye-doma",               name: "Монолитный дом",                shell: 35000, warmShell: 50000, preFinish: 70000, turnkey: 90000, turnkeyMaterials: 180000, sort: 8 },
  { slug: "kombinirovannye-doma",          name: "Комбинированный дом",           shell: 40000, warmShell: 55000, preFinish: 75000, turnkey: 95000, turnkeyMaterials: 190000, sort: 9 },
];

const HOUSE_WORK: PriceItem[] = HOUSE_ROWS.flatMap((r) => [
  { id: `house-work-${r.slug}-shell`,     category: "house_construction_work", serviceSlug: r.slug, name: `${r.name} — коробка`,                  unit: "м²", priceFrom: r.shell,     mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: r.sort * 10 + 1 },
  { id: `house-work-${r.slug}-warm`,      category: "house_construction_work", serviceSlug: r.slug, name: `${r.name} — тёплый контур`,           unit: "м²", priceFrom: r.warmShell, mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: r.sort * 10 + 2 },
  { id: `house-work-${r.slug}-prefinish`, category: "house_construction_work", serviceSlug: r.slug, name: `${r.name} — под чистовую отделку`,   unit: "м²", priceFrom: r.preFinish, mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: r.sort * 10 + 3 },
  { id: `house-work-${r.slug}-turnkey`,   category: "house_construction_work", serviceSlug: r.slug, name: `${r.name} — под ключ`,                unit: "м²", priceFrom: r.turnkey,   mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: r.sort * 10 + 4 },
]);

// ───────────────────────────────────────────────────────────────────────────────
// 4. СТРОИТЕЛЬСТВО ДОМОВ — РАБОТЫ И БАЗОВЫЕ МАТЕРИАЛЫ (§7 запроса).
//    Единственная категория, где materialsIncluded=true.
// ───────────────────────────────────────────────────────────────────────────────
const HOUSE_MATERIALS: PriceItem[] = HOUSE_ROWS.map((r) => ({
  id: `house-materials-${r.slug}-turnkey`,
  category: "house_construction_materials",
  serviceSlug: r.slug,
  name: `${r.name} — под ключ с базовыми материалами`,
  unit: "м²",
  priceFrom: r.turnkeyMaterials,
  mode: "work_and_basic_materials",
  materialsIncluded: true,
  actualDate: "2026-06",
  sortOrder: r.sort,
}));

// ───────────────────────────────────────────────────────────────────────────────
// 5. МОНОЛИТНЫЕ РАБОТЫ — стартовая позиция (§12.3 главной).
//    Подробная построчная таблица §17 ТЗ — ввести дословно перед подэтапом 2.4.
// ───────────────────────────────────────────────────────────────────────────────
const MONOLITHIC: PriceItem[] = [
  { id: "monolithic-starting", category: "monolithic", serviceSlug: "monolitnye-raboty", name: "Монолитные работы (стартовая позиция)", unit: "м³", priceFrom: 18000, mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 1 },
];

// ───────────────────────────────────────────────────────────────────────────────
// 6–9. ФУНДАМЕНТЫ / КЛАДКА / КРОВЛЯ / ФАСАДЫ — §17 ТЗ.
//      Построчные таблицы переданы в исходном ТЗ; ввести дословно перед подэтапом 2.4.
// ───────────────────────────────────────────────────────────────────────────────
const FOUNDATIONS: PriceItem[] = [];
const MASONRY: PriceItem[] = [];
const ROOFING: PriceItem[] = [];
const FACADES: PriceItem[] = [];

// ───────────────────────────────────────────────────────────────────────────────
// 10. ГЕНЕРАЛЬНЫЙ ПОДРЯД (§8 запроса).
// ───────────────────────────────────────────────────────────────────────────────
const GENERAL_CONTRACTING: PriceItem[] = [
  { id: "gc-coordination",      category: "general_contracting", serviceSlug: "generalnyy-podryad", name: "Координация подрядчиков",                          unit: "%",      percentageFrom: 3,                              mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 1, note: "от стоимости СМР" },
  { id: "gc-full",              category: "general_contracting", serviceSlug: "generalnyy-podryad", name: "Полноценный генеральный подряд",                   unit: "%",      percentageFrom: 5,                              mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 2, note: "от стоимости СМР" },
  { id: "gc-logistics",         category: "general_contracting", serviceSlug: "generalnyy-podryad", name: "Логистика, техника и инфраструктура",              unit: "%",      percentageFrom: 7,                              mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 3, note: "от стоимости СМР" },
  { id: "gc-complex",           category: "general_contracting", serviceSlug: "generalnyy-podryad", name: "Сложные объекты",                                  unit: "%",      percentageFrom: 10,                             mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 4, note: "от стоимости СМР" },
  { id: "gc-project-manager",   category: "general_contracting", serviceSlug: "generalnyy-podryad", name: "Руководитель проекта",                             unit: "месяц",  priceFrom: 250000,                              mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 5 },
  { id: "gc-quality-engineer",  category: "general_contracting", serviceSlug: "generalnyy-podryad", name: "Инженер строительного контроля",                   unit: "месяц",  priceFrom: 180000,                              mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 6 },
  { id: "gc-documentation",     category: "general_contracting", serviceSlug: "generalnyy-podryad", name: "Исполнительная документация",                      unit: "месяц",  priceFrom: 150000,                              mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 7 },
];

// ───────────────────────────────────────────────────────────────────────────────
// 11. ПАКЕТЫ ЭЛЕКТРОМОНТАЖА (§9 запроса).
// ───────────────────────────────────────────────────────────────────────────────
const ELECTRICAL_PACKAGES: PriceItem[] = [
  { id: "electrical-pkg-basic",    category: "electrical_packages", serviceSlug: "elektromontazh", name: "Электромонтаж — базовый",  unit: "м²", priceFrom: 2500, mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 1 },
  { id: "electrical-pkg-standard", category: "electrical_packages", serviceSlug: "elektromontazh", name: "Электромонтаж — стандарт", unit: "м²", priceFrom: 3500, mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 2 },
  { id: "electrical-pkg-premium",  category: "electrical_packages", serviceSlug: "elektromontazh", name: "Электромонтаж — премиум",  unit: "м²", priceFrom: 5000, mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 3 },
];

// ───────────────────────────────────────────────────────────────────────────────
// 12–22. ОСТАЛЬНЫЕ КАТЕГОРИИ — §17 / §19–§32 ТЗ.
//        Построчные таблицы переданы в исходном ТЗ; ввести дословно перед подэтапами 2.4–2.5.
// ───────────────────────────────────────────────────────────────────────────────
const ELECTRICAL: PriceItem[] = [];
const PLUMBING_PACKAGES: PriceItem[] = [];
const PLUMBING: PriceItem[] = [];
const WATER_SUPPLY: PriceItem[] = [];
const HEATING_PACKAGES: PriceItem[] = [];
const HEATING: PriceItem[] = [];
const UNDERFLOOR_HEATING: PriceItem[] = [
  { id: "underfloor-starting", category: "underfloor_heating", serviceSlug: "teplyy-pol", name: "Тёплый пол (стартовая позиция таблицы §31)", unit: "м²", priceLabel: "Уточняется по таблице ТЗ", mode: "individual", materialsIncluded: false, actualDate: "2026-06", sortOrder: 1 },
];
const TILING: PriceItem[] = [
  { id: "tiling-starting", category: "tiling", serviceSlug: "ukladka-plitki", name: "Укладка плитки (стартовая позиция)", unit: "м²", priceFrom: 2800, mode: "work", materialsIncluded: false, actualDate: "2026-06", sortOrder: 1 },
];
const FINISHING_WALLS: PriceItem[] = [];
const FINISHING_FLOORS: PriceItem[] = [];
const FINISHING_CEILINGS: PriceItem[] = [];
const FINISHING_DOORS: PriceItem[] = [];
const DEMOLITION: PriceItem[] = [
  { id: "demolition-waste-removal", category: "demolition", name: "Вывоз строительного мусора", unit: "контейнер", priceLabel: "Рассчитывается отдельно", mode: "individual", materialsIncluded: false, actualDate: "2026-06", sortOrder: 99 },
];

// ───────────────────────────────────────────────────────────────────────────────
// Объединение и публичные хелперы.
// ───────────────────────────────────────────────────────────────────────────────
export const PRICES: PriceItem[] = [
  ...REPAIR_PACKAGES,
  ...ADDITIONAL_REPAIRS,
  ...HOUSE_WORK,
  ...HOUSE_MATERIALS,
  ...MONOLITHIC,
  ...FOUNDATIONS,
  ...MASONRY,
  ...ROOFING,
  ...FACADES,
  ...GENERAL_CONTRACTING,
  ...ELECTRICAL_PACKAGES,
  ...ELECTRICAL,
  ...PLUMBING_PACKAGES,
  ...PLUMBING,
  ...WATER_SUPPLY,
  ...HEATING_PACKAGES,
  ...HEATING,
  ...UNDERFLOOR_HEATING,
  ...TILING,
  ...FINISHING_WALLS,
  ...FINISHING_FLOORS,
  ...FINISHING_CEILINGS,
  ...FINISHING_DOORS,
  ...DEMOLITION,
];

export function getPricesByCategory(category: PriceItem["category"]): PriceItem[] {
  return PRICES.filter((p) => p.category === category).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getPriceById(id: string): PriceItem | undefined {
  return PRICES.find((p) => p.id === id);
}

export function getPricesByService(slug: string): PriceItem[] {
  return PRICES.filter((p) => p.serviceSlug === slug).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Перечень категорий, для которых построчные таблицы ТЗ ещё не введены. */
export const PRICE_CATEGORIES_PENDING_INPUT: PriceItem["category"][] = [
  "additional_repairs",
  "foundations",
  "masonry",
  "roofing",
  "facades",
  "electrical",
  "plumbing_packages",
  "plumbing",
  "water_supply",
  "heating_packages",
  "heating",
  "finishing_walls",
  "finishing_floors",
  "finishing_ceilings",
  "finishing_doors",
];
