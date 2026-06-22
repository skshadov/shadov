/**
 * Подэтап 2.5.3 — фиксированная спецификация калькулятора предварительной
 * стоимости работ. Используется UI и аудитом. Источник истины: пункты ТЗ
 * §11 (маршруты), §13 (коэффициенты), §10 (инженерные системы), §34
 * (формулы калькулятора), а также утверждённые цены prices.ts.
 *
 * Любое правило, формула или коэффициент имеет указанный источник. Если
 * правило не зафиксировано в ТЗ, использовать значение `null`, а не
 * приблизительное.
 */
import type { CalculatorMode, HouseCompletionLevel } from "@/types/calculator";
import type { PriceCategory } from "@/types/pricing";

export const CALCULATOR_ROUTE = "/kalkulyator-stoimosti" as const;
export const CALCULATOR_CANONICAL = "https://shadov.pro/kalkulyator-stoimosti" as const;

export type CalculatorModeSpec = {
  id: CalculatorMode;
  label: string;
  description: string;
  priceCategories: PriceCategory[];
  packageCategories: PriceCategory[];
  separateCategories: PriceCategory[];
  forbiddenAutoCalculations: string[];
};

export const CALCULATOR_MODE_SPECS: CalculatorModeSpec[] = [
  {
    id: "repair",
    label: "Ремонт",
    description: "Пакеты ремонта, дополнительные варианты, демонтаж, плитка, чистовая отделка.",
    priceCategories: [
      "repair_packages",
      "additional_repairs",
      "demolition",
      "tiling",
      "finishing_walls",
      "finishing_floors",
      "finishing_ceilings",
      "finishing_doors",
    ],
    packageCategories: ["repair_packages"],
    separateCategories: [
      "additional_repairs",
      "demolition",
      "tiling",
      "finishing_walls",
      "finishing_floors",
      "finishing_ceilings",
      "finishing_doors",
    ],
    forbiddenAutoCalculations: [
      "Площадь стен не рассчитывается автоматически из площади пола.",
      "Площадь потолка не рассчитывается автоматически из площади пола.",
      "Объёмы по пог. м, шт. и комплектам вводятся пользователем вручную.",
    ],
  },
  {
    id: "house",
    label: "Строительство частного дома",
    description:
      "9 технологий, 4 уровня готовности и альтернативный режим «под ключ с базовыми материалами».",
    priceCategories: ["house_construction_work", "house_construction_materials"],
    packageCategories: ["house_construction_work", "house_construction_materials"],
    separateCategories: [],
    forbiddenAutoCalculations: [
      "Цена работ и цена «под ключ с базовыми материалами» не складываются — это альтернативы.",
      "Фундамент, кровля, фасад не добавляются повторно, если они входят в выбранный уровень.",
      "Объём бетона, площадь фасада, площадь кровли, количество блоков не выводятся из площади дома.",
      "Инженерные точки не рассчитываются по площади дома.",
    ],
  },
  {
    id: "construction",
    label: "Отдельные строительные работы",
    description:
      "Монолитные, фундаментные, кладочные, кровельные и фасадные работы — каждая позиция вводится в её фактической единице.",
    priceCategories: ["monolithic", "foundations", "masonry", "roofing", "facades", "general_contracting"],
    packageCategories: [],
    separateCategories: ["monolithic", "foundations", "masonry", "roofing", "facades", "general_contracting"],
    forbiddenAutoCalculations: [
      "Объём бетона не вычисляется из площади здания.",
      "Тип фундамента не выбирается автоматически.",
      "Площадь кровли не вычисляется из площади пола.",
      "Площадь фасада не вычисляется из площади дома.",
      "Комплексное кровельное решение и входящие в него отдельные операции не суммируются автоматически.",
      "Стоимость генерального подряда рассчитывается только после ручного ввода стоимости СМР.",
    ],
  },
  {
    id: "engineering",
    label: "Инженерные системы",
    description:
      "Электромонтаж, сантехника, водоснабжение и канализация, отопление, тёплый пол. Пакеты и отдельные работы.",
    priceCategories: [
      "electrical_packages",
      "electrical",
      "plumbing_packages",
      "plumbing",
      "water_supply",
      "heating_packages",
      "heating",
      "underfloor_heating",
    ],
    packageCategories: ["electrical_packages", "plumbing_packages", "heating_packages"],
    separateCategories: ["electrical", "plumbing", "water_supply", "heating", "underfloor_heating"],
    forbiddenAutoCalculations: [
      "Количество электрических и сантехнических точек не вычисляется из площади.",
      "Мощность отопления не рассчитывается.",
      "Тёплый пол не утверждается как единственный источник отопления.",
      "Пакет и отдельная работа не суммируются автоматически.",
    ],
  },
];

export const HOUSE_COMPLETION_LEVELS_SPEC: Array<{ id: HouseCompletionLevel; label: string; idSuffix: string; category: PriceCategory }> = [
  { id: "shell",             label: "Коробка",                       idSuffix: "shell",             category: "house_construction_work" },
  { id: "warm",              label: "Тёплый контур",                 idSuffix: "warm",              category: "house_construction_work" },
  { id: "prefinish",         label: "Под чистовую отделку",          idSuffix: "prefinish",         category: "house_construction_work" },
  { id: "turnkey",           label: "Под ключ",                      idSuffix: "turnkey",           category: "house_construction_work" },
  { id: "turnkey-materials", label: "Под ключ с базовыми материалами", idSuffix: "turnkey-materials", category: "house_construction_materials" },
];

/**
 * Категории, где выбор пакета подразумевает, что отдельные работы из
 * сопоставленной категории могут уже входить в его стоимость. Калькулятор
 * не складывает их автоматически — он показывает предупреждение.
 */
export const PACKAGE_CONFLICTS: Record<string, PriceCategory[]> = {
  repair_packages: [
    "additional_repairs",
    "demolition",
    "tiling",
    "finishing_walls",
    "finishing_floors",
    "finishing_ceilings",
    "finishing_doors",
  ],
  house_construction_work: ["monolithic", "foundations", "masonry", "roofing", "facades"],
  house_construction_materials: ["house_construction_work", "monolithic", "foundations", "masonry", "roofing", "facades"],
  electrical_packages: ["electrical"],
  plumbing_packages: ["plumbing"],
  heating_packages: ["heating"],
};

export const ROOFING_COMPLEX_PREFIX = "roofing-complex-" as const;

/**
 * Идентификаторы позиций, расчёт которых разрешён только по проекту.
 * Источник: prices.ts (priceLabel="Рассчитывается отдельно" или mode="individual").
 */
export const BY_PROJECT_ITEM_IDS: string[] = [
  "demolition-vyvoz",
];

export const CALCULATOR_DISCLAIMERS: string[] = [
  "Расчёт является предварительным.",
  "Результат не является сметой, коммерческим предложением или публичной офертой.",
  "Точная стоимость определяется после изучения проекта, объекта и состава работ.",
  "Материалы, оборудование и дополнительные работы учитываются только при их явном включении в расчёт.",
];

export const HOUSE_CALCULATOR_DISCLAIMER =
  "Точный состав комплектации фиксируется в смете и договоре с учётом проекта выбранного дома.";

export const CALCULATOR_LINKS_FROM_SERVICES: Array<{
  slug: string;
  mode: CalculatorMode;
  category?: PriceCategory;
}> = [
  { slug: "remont",                       mode: "repair" },
  { slug: "remont-pod-klyuch",            mode: "repair" },
  { slug: "stroitelstvo",                 mode: "house" },
  { slug: "stroitelstvo-domov-pod-klyuch", mode: "house" },
  { slug: "monolitnye-raboty",            mode: "construction", category: "monolithic" },
  { slug: "fundamenty",                   mode: "construction", category: "foundations" },
  { slug: "kladochnye-raboty",            mode: "construction", category: "masonry" },
  { slug: "krovelnye-raboty",             mode: "construction", category: "roofing" },
  { slug: "fasadnye-raboty",              mode: "construction", category: "facades" },
  { slug: "inzhenernye-sistemy",          mode: "engineering" },
  { slug: "elektromontazh",               mode: "engineering", category: "electrical" },
  { slug: "santehnika",                   mode: "engineering", category: "plumbing" },
  { slug: "vodosnabzhenie-kanalizatsiya", mode: "engineering", category: "water_supply" },
  { slug: "otoplenie",                    mode: "engineering", category: "heating" },
  { slug: "teplyy-pol",                   mode: "engineering", category: "underfloor_heating" },
];

/**
 * Метаданные страницы калькулятора. Используются в route-файле и в аудите.
 */
export const CALCULATOR_METADATA = {
  h1: "Калькулятор предварительной стоимости работ",
  title: "Калькулятор стоимости строительства и ремонта — Шадов и партнёры",
  description:
    "Предварительный расчёт стоимости ремонта, строительства частного дома, отдельных строительных и инженерных работ по действующему прайсу.",
  canonical: CALCULATOR_CANONICAL,
  ogType: "website" as const,
} as const;

/**
 * Спецификация формул. Каждая формула применяется только к совместимым
 * позициям. Запрещены формулы, требующие коэффициента площади.
 */
export const CALCULATOR_FORMULAS = [
  {
    id: "fixed-unit",
    description: "Стоимость позиции = объём × цена за единицу",
    appliesTo: "Позиции prices.ts с priceFrom и совместимой единицей.",
    source: "prices.ts — поля priceFrom, unit",
  },
  {
    id: "package-area",
    description: "Стоимость пакета = площадь × цена пакета за м²",
    appliesTo: "Пакеты со значением unit=\"м²\" (repair_packages, electrical_packages, plumbing_packages chastnyy-dom, heating_packages с unit=м²).",
    source: "prices.ts — пакеты с unit=\"м²\"",
  },
  {
    id: "percentage",
    description: "Стоимость = базовая стоимость × процент / 100",
    appliesTo: "Позиции general_contracting с percentageFrom. База — ручной ввод пользователя.",
    source: "prices.ts — поля percentageFrom",
  },
  {
    id: "per-unit",
    description: "Стоимость = количество × цена за штуку/комплект/пог. м",
    appliesTo: "Позиции с unit ∈ {шт., комплект, пог. м, м³, тонна, точка, контур, отверстие, контейнер, модуль, месяц}.",
    source: "prices.ts — поля priceFrom, unit",
  },
] as const;

/**
 * Список явно запрещённых автоматических вычислений (объединение из всех
 * режимов плюс глобальные ограничения §13/§34).
 */
export const CALCULATOR_PROHIBITED_AUTO_CALCULATIONS: string[] = [
  "Площадь стен из площади пола.",
  "Площадь потолка из площади пола.",
  "Площадь фасада из площади дома.",
  "Площадь кровли из площади пола или дома.",
  "Объём бетона из площади здания.",
  "Количество блоков из площади стен.",
  "Мощность отопления.",
  "Количество электрических точек из площади.",
  "Количество сантехнических точек из площади.",
  "Стоимость оборудования по характеристикам.",
  "Процент запаса.",
  "Региональный коэффициент.",
  "Коэффициент сложности.",
  "Стоимость генподряда без ручного ввода базы СМР.",
  "Автоматический расчёт многоквартирного дома.",
];

/**
 * Открытые вопросы (требования, не зафиксированные в ТЗ как конкретные
 * числа). Калькулятор не подставляет значения вместо них.
 */
export const CALCULATOR_UNRESOLVED_QUESTIONS: string[] = [
  "Конкретные значения коэффициентов §13 применяются только в смете; в калькуляторе не используются.",
  "Площадь стен и потолка пользователь вводит вручную: формула пересчёта из площади пола не подтверждена.",
  "Площадь фасада, площадь кровли, объём бетона: пользователь вводит вручную.",
];

export const CALCULATOR_IMPLEMENTATION_STATUS = "complete" as const;
