/**
 * Подэтап 2.1 — пакеты комплексного ремонта (§6 запроса).
 * Состав, исключения, уровни инженерных работ и факторы изменения стоимости
 * заполняются дословно из ТЗ перед подэтапом 2.3. На текущем подэтапе фиксируются
 * только утверждённые названия, цены и идентификаторы.
 */

export type RepairPackage = {
  id: string;
  slug?: string;
  name: string;
  priceFrom: number;
  unit: "м²";
  suitableFor: string;
  included: string[];
  excluded: string[];
  engineeringLevel: string[];
  surfacePreparation: string[];
  finishingSolutions: string[];
  priceFactors: string[];
};

export const REPAIR_PACKAGES: RepairPackage[] = [
  {
    id: "cosmetic",
    slug: "kosmeticheskiy-remont",
    name: "Косметический",
    priceFrom: 6500,
    unit: "м²",
    suitableFor: "Освежение помещения без замены инженерных систем и без перепланировки.",
    included: [],
    excluded: [],
    engineeringLevel: [],
    surfacePreparation: [],
    finishingSolutions: [],
    priceFactors: [],
  },
  {
    id: "econom",
    slug: "ekonom-remont",
    name: "Эконом",
    priceFrom: 12000,
    unit: "м²",
    suitableFor: "Объекты, где требуется привести помещение к функциональному состоянию.",
    included: [],
    excluded: [],
    engineeringLevel: [],
    surfacePreparation: [],
    finishingSolutions: [],
    priceFactors: [],
  },
  {
    id: "standard",
    slug: "standartnyy-remont",
    name: "Стандартный",
    priceFrom: 18000,
    unit: "м²",
    suitableFor: "Полноценный ремонт без сложных дизайнерских решений.",
    included: [],
    excluded: [],
    engineeringLevel: [],
    surfacePreparation: [],
    finishingSolutions: [],
    priceFactors: [],
  },
  {
    id: "euro",
    slug: "evroremont",
    name: "Евроремонт / комфорт",
    priceFrom: 25000,
    unit: "м²",
    suitableFor: "Современные европейские стандарты отделки и инженерных решений.",
    included: [],
    excluded: [],
    engineeringLevel: [],
    surfacePreparation: [],
    finishingSolutions: [],
    priceFactors: [],
  },
  {
    id: "business",
    slug: "biznes-remont",
    name: "Бизнес",
    priceFrom: 35000,
    unit: "м²",
    suitableFor: "Помещения класса бизнес с повышенными требованиями к дизайну и материалам.",
    included: [],
    excluded: [],
    engineeringLevel: [],
    surfacePreparation: [],
    finishingSolutions: [],
    priceFactors: [],
  },
  {
    id: "premium",
    slug: "premialnyy-remont",
    name: "Премиальный",
    priceFrom: 48000,
    unit: "м²",
    suitableFor: "Премиальные объекты с авторским дизайн-проектом и расширенной инженерией.",
    included: [],
    excluded: [],
    engineeringLevel: [],
    surfacePreparation: [],
    finishingSolutions: [],
    priceFactors: [],
  },
  {
    id: "exclusive",
    slug: undefined, // эксклюзивный пакет размещается на /remont-pod-klyuch
    name: "Эксклюзивный",
    priceFrom: 65000,
    unit: "м²",
    suitableFor: "Эксклюзивные объекты с индивидуальным проектом, нестандартными материалами и сложной инженерией.",
    included: [],
    excluded: [],
    engineeringLevel: [],
    surfacePreparation: [],
    finishingSolutions: [],
    priceFactors: [],
  },
];

export function getRepairPackage(id: string): RepairPackage | undefined {
  return REPAIR_PACKAGES.find((p) => p.id === id);
}
