/**
 * Подэтап 2.1 — технологии строительства домов и уровни готовности (§7–§8 запроса).
 * Цены строго из утверждённой таблицы; преимущества/ограничения формулируются нейтрально
 * и наполняются дословно из §15 ТЗ перед подэтапом 2.4.
 */

export type HouseCompletionLevelId = "shell" | "warmShell" | "preFinish" | "turnkey";

export type HouseTechnology = {
  id: string;
  slug: string;
  name: string;
  workPrices: {
    shell: number;
    warmShell: number;
    preFinish: number;
    turnkey: number;
  };
  turnkeyWithBasicMaterials: number;
  benefits: string[];
  limitations: string[];
  constructionStages: string[];
  suitableFoundations: string[];
  wallSystem: string[];
  floorSystems: string[];
  roofOptions: string[];
  engineeringSystems: string[];
};

export const HOUSE_TECHNOLOGIES: HouseTechnology[] = [
  { id: "karkas",      slug: "karkasnye-doma",               name: "Каркасный дом",                workPrices: { shell: 18000, warmShell: 26000, preFinish: 36000, turnkey: 45000 }, turnkeyWithBasicMaterials: 95000,  benefits: [], limitations: [], constructionStages: [], suitableFoundations: [], wallSystem: [], floorSystems: [], roofOptions: [], engineeringSystems: [] },
  { id: "sip",         slug: "doma-iz-sip-paneley",          name: "Дом из СИП-панелей",            workPrices: { shell: 17000, warmShell: 25000, preFinish: 35000, turnkey: 44000 }, turnkeyWithBasicMaterials: 90000,  benefits: [], limitations: [], constructionStages: [], suitableFoundations: [], wallSystem: [], floorSystems: [], roofOptions: [], engineeringSystems: [] },
  { id: "brus",        slug: "doma-iz-brusa",                name: "Дом из профилированного бруса", workPrices: { shell: 20000, warmShell: 28000, preFinish: 38000, turnkey: 48000 }, turnkeyWithBasicMaterials: 105000, benefits: [], limitations: [], constructionStages: [], suitableFoundations: [], wallSystem: [], floorSystems: [], roofOptions: [], engineeringSystems: [] },
  { id: "kleenyy-brus",slug: "doma-iz-kleenogo-brusa",       name: "Дом из клееного бруса",         workPrices: { shell: 24000, warmShell: 34000, preFinish: 46000, turnkey: 58000 }, turnkeyWithBasicMaterials: 125000, benefits: [], limitations: [], constructionStages: [], suitableFoundations: [], wallSystem: [], floorSystems: [], roofOptions: [], engineeringSystems: [] },
  { id: "gazobeton",   slug: "doma-iz-gazobetona",           name: "Дом из газобетона",             workPrices: { shell: 25000, warmShell: 36000, preFinish: 50000, turnkey: 65000 }, turnkeyWithBasicMaterials: 125000, benefits: [], limitations: [], constructionStages: [], suitableFoundations: [], wallSystem: [], floorSystems: [], roofOptions: [], engineeringSystems: [] },
  { id: "keramoblok",  slug: "doma-iz-keramicheskih-blokov", name: "Дом из керамических блоков",    workPrices: { shell: 28000, warmShell: 40000, preFinish: 55000, turnkey: 72000 }, turnkeyWithBasicMaterials: 145000, benefits: [], limitations: [], constructionStages: [], suitableFoundations: [], wallSystem: [], floorSystems: [], roofOptions: [], engineeringSystems: [] },
  { id: "kirpich",     slug: "kirpichnye-doma",              name: "Кирпичный дом",                 workPrices: { shell: 32000, warmShell: 45000, preFinish: 62000, turnkey: 80000 }, turnkeyWithBasicMaterials: 165000, benefits: [], limitations: [], constructionStages: [], suitableFoundations: [], wallSystem: [], floorSystems: [], roofOptions: [], engineeringSystems: [] },
  { id: "monolit",     slug: "monolitnye-doma",              name: "Монолитный дом",                workPrices: { shell: 35000, warmShell: 50000, preFinish: 70000, turnkey: 90000 }, turnkeyWithBasicMaterials: 180000, benefits: [], limitations: [], constructionStages: [], suitableFoundations: [], wallSystem: [], floorSystems: [], roofOptions: [], engineeringSystems: [] },
  { id: "kombinirovannyy", slug: "kombinirovannye-doma",     name: "Комбинированный дом",           workPrices: { shell: 40000, warmShell: 55000, preFinish: 75000, turnkey: 95000 }, turnkeyWithBasicMaterials: 190000, benefits: [], limitations: [], constructionStages: [], suitableFoundations: [], wallSystem: [], floorSystems: [], roofOptions: [], engineeringSystems: [] },
];

export type HouseCompletionLevel = {
  id: HouseCompletionLevelId;
  name: string;
  included: string[];
  excluded: string[];
};

/**
 * Состав уровней готовности — §16 ТЗ.
 * На подэтапе 2.1 фиксируются названия и ключевые исключения комплектации «под ключ».
 * Полные списки included/excluded вводятся перед подэтапом 2.4 дословно.
 */
export const HOUSE_COMPLETION_LEVELS: HouseCompletionLevel[] = [
  { id: "shell",      name: "Коробка",                included: [], excluded: [] },
  { id: "warmShell",  name: "Тёплый контур",          included: [], excluded: [] },
  { id: "preFinish",  name: "Под чистовую отделку",   included: [], excluded: [] },
  {
    id: "turnkey",
    name: "Под ключ",
    included: [],
    excluded: [
      "Мебель рассчитывается отдельно",
      "Кухня рассчитывается отдельно",
      "Бытовая техника рассчитывается отдельно",
      "Благоустройство рассчитывается отдельно",
      "Дорогостоящее оборудование рассчитывается отдельно",
    ],
  },
];

export function getHouseTechnology(slug: string): HouseTechnology | undefined {
  return HOUSE_TECHNOLOGIES.find((t) => t.slug === slug);
}

export function getHouseCompletionLevel(id: HouseCompletionLevelId): HouseCompletionLevel | undefined {
  return HOUSE_COMPLETION_LEVELS.find((l) => l.id === id);
}
