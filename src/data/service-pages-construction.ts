/**
 * Подэтап 2.4.1 — данные 18 страниц строительного раздела.
 * На 2.4.1 маршруты к этим данным ещё не подключены. Все строительные
 * route-файлы остаются RouteStub с noindex до итераций 2.4.2–2.4.4.
 *
 * Источники цен: src/data/prices.ts, src/data/house-technologies.ts.
 * Цены не дублируются в этом файле — отображаются через priceCategoryIds
 * и компонент HouseTechnologyMatrix.
 */
import type { ServicePageData } from "@/types/services";
import type { PriceCategory } from "@/types/pricing";
import { HOUSE_TECHNOLOGIES } from "./house-technologies";

// ─────────────────────────────────────────────────────────────────────────
// Общие переиспользуемые блоки контента
// ─────────────────────────────────────────────────────────────────────────

const STAGES_HOUSE = [
  "Изучение участка и исходных данных",
  "Геология и геодезия, если предусмотрены проектом",
  "Проектирование или изучение готового проекта",
  "Подготовка площадки",
  "Устройство фундамента",
  "Возведение несущих конструкций",
  "Устройство перекрытий",
  "Монтаж кровли",
  "Установка окон и наружных дверей",
  "Фасадные работы",
  "Инженерные системы",
  "Черновая отделка",
  "Чистовая отделка",
  "Проверка и сдача",
];

const STAGES_MONOLITHIC = [
  "Изучение раздела КЖ",
  "Геодезическая разбивка",
  "Подготовка основания",
  "Монтаж опалубки",
  "Армирование",
  "Проверка закладных и защитного слоя",
  "Приёмка скрытых работ",
  "Бетонирование",
  "Уход за бетоном",
  "Распалубка",
  "Геодезическая проверка",
  "Исполнительная документация",
];

const STAGES_FOUNDATIONS = [
  "Изучение проекта и данных основания",
  "Геодезическая разбивка",
  "Разработка грунта",
  "Подготовка основания",
  "Песчаная и щебёночная подготовка",
  "Подбетонка, если предусмотрена",
  "Гидроизоляция",
  "Опалубка",
  "Армирование",
  "Инженерные вводы",
  "Бетонирование",
  "Уход за бетоном",
  "Утепление",
  "Дренаж",
  "Исполнительная проверка",
];

const STAGES_MASONRY = [
  "Проверка основания",
  "Устройство гидроизоляции",
  "Разметка",
  "Кладка первого ряда",
  "Возведение стен или перегородок",
  "Армирование",
  "Монтаж перемычек",
  "Устройство армопоясов",
  "Проверка геометрии",
  "Защита незавершённой кладки",
];

const STAGES_ROOFING = [
  "Проверка несущих конструкций",
  "Монтаж мауэрлата",
  "Стропильная система",
  "Пароизоляция",
  "Утепление",
  "Гидроветрозащита",
  "Контробрешётка",
  "Обрешётка или сплошное основание",
  "Кровельное покрытие",
  "Примыкания",
  "Водосточная система",
  "Снегозадержание",
  "Финальная проверка",
];

const STAGES_FACADES = [
  "Проверка основания",
  "Подготовка поверхности",
  "Монтаж утепления, если предусмотрено",
  "Устройство подсистемы или армирующего слоя",
  "Монтаж облицовки либо декоративного покрытия",
  "Устройство примыканий",
  "Оформление проёмов",
  "Финальная проверка",
];

const QC_FULL = [
  "Проверка проектной документации",
  "Входной контроль материалов",
  "Проверка основания",
  "Геодезическая разбивка",
  "Контроль геометрии",
  "Фотофиксация",
  "Проверка скрытых работ",
  "Акты скрытых работ",
  "Лабораторные испытания, когда они требуются",
  "Промежуточная приёмка",
  "Фиксация замечаний",
  "Исполнительная документация",
  "Финальная проверка",
];

const QC_TRADE = [
  "Входной контроль материалов",
  "Проверка основания",
  "Контроль геометрии",
  "Фотофиксация",
  "Проверка скрытых работ",
  "Акты скрытых работ",
  "Промежуточная приёмка",
  "Фиксация замечаний",
  "Исполнительная документация",
  "Финальная проверка",
];

const DOCS_FULL = [
  "Договор",
  "Смета",
  "Календарный график",
  "Проектная документация",
  "Акты скрытых работ",
  "Журналы работ",
  "Исполнительные схемы",
  "Сертификаты и паспорта материалов, когда они передаются поставщиком",
  "Акты выполненных работ",
  "Отчёты",
  "Гарантийные обязательства по договору",
];

const DOCS_TRADE = [
  "Договор",
  "Смета",
  "Календарный график",
  "Акты скрытых работ",
  "Исполнительные схемы",
  "Сертификаты и паспорта материалов, когда они передаются поставщиком",
  "Акты выполненных работ",
  "Гарантийные обязательства по договору",
];

const TIMELINE_HOUSE = [
  "Площадь дома",
  "Архитектура",
  "Конструктивная схема",
  "Геология",
  "Тип фундамента",
  "Этажность",
  "Пролёты",
  "Тип кровли",
  "Тип фасада",
  "Состав инженерных систем",
  "Выбранный уровень готовности",
  "Выбранные материалы",
  "Условия площадки",
  "Подъезд",
  "Сезонность",
  "Необходимость прогрева",
  "Объём документации",
  "Сложность узлов",
  "Удалённость объекта",
];

const TIMELINE_TRADE = [
  "Объём работ",
  "Конструктивная схема",
  "Сложность узлов",
  "Условия площадки",
  "Подъезд",
  "Сезонность",
  "Необходимость прогрева",
  "Объём документации",
  "Удалённость объекта",
];

const FAQ_BASE = [
  "calc-without-visit",
  "exact-estimate-needs",
  "existing-project",
  "payment-stages",
  "materials-procurement",
  "remote-control",
  "hidden-works",
  "documents-handover",
  "additional-works",
  "single-works",
  "intermediaries",
  "sro-confirmation",
  "after-handover",
];

const RELATED_HOUSE = [
  "stroitelstvo-domov-pod-klyuch",
  "fundamenty",
  "krovelnye-raboty",
  "fasadnye-raboty",
];

const VOL = (value: number) =>
  ({ value, label: "Демонстрационный объём" } as const);

const NOTE_BREAKDOWN =
  "Окончательная разбивка зависит от проекта и комплектации.";

// Универсальный пример сметы для общих этапов дома (light): свайно-ростверк +
// песок + стропильная + утепление кровли + подготовка фасада.
const HOUSE_LIGHT_ESTIMATE_IDS = [
  "foundations-svayno-rostverk",
  "foundations-pesok",
  "roofing-stropilka",
  "roofing-uteplenie",
  "facades-podgotovka",
];
const HOUSE_LIGHT_ESTIMATE_VOL = {
  "foundations-svayno-rostverk": VOL(120),
  "foundations-pesok": VOL(80),
  "roofing-stropilka": VOL(150),
  "roofing-uteplenie": VOL(150),
  "facades-podgotovka": VOL(180),
};
const HOUSE_LIGHT_NOTES = {
  "foundations-svayno-rostverk": NOTE_BREAKDOWN,
};

// Пример для каменных технологий.
const HOUSE_MASONRY_ESTIMATE_IDS = [
  "foundations-plita",
  "masonry-gazobeton-naruzh",
  "masonry-armopoyas",
  "roofing-stropilka",
  "facades-mokryy",
];
const HOUSE_MASONRY_ESTIMATE_VOL = {
  "foundations-plita": VOL(40),
  "masonry-gazobeton-naruzh": VOL(35),
  "masonry-armopoyas": VOL(4),
  "roofing-stropilka": VOL(150),
  "facades-mokryy": VOL(180),
};
const HOUSE_MASONRY_NOTES = {
  "foundations-plita": NOTE_BREAKDOWN,
};

// ─────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────

function houseTech(slug: string) {
  return HOUSE_TECHNOLOGIES.find((t) => t.slug === slug)!;
}

function relatedFor(slug: string): string[] {
  return RELATED_HOUSE.filter((s) => s !== slug && s !== "stroitelstvo-domov-pod-klyuch");
}

// ─────────────────────────────────────────────────────────────────────────
// Запись 1. /stroitelstvo — агрегатор раздела
// ─────────────────────────────────────────────────────────────────────────

const PAGE_STROITELSTVO: ServicePageData = {
  slug: "stroitelstvo",
  route: "/stroitelstvo",
  category: "construction",
  title: "Строительство",
  metaTitle:
    "Строительство частных и многоквартирных домов — Шадов и партнёры",
  metaDescription:
    "Строительство частных и многоквартирных домов, генеральный подряд и отдельные строительные работы. Прямой договор и поэтапная приёмка.",
  h1: "Строительство частных и многоквартирных домов в Москве и Московской области",
  description:
    "Строительная компания «Шадов и партнёры» выполняет строительство частных и многоквартирных домов, функции генерального подрядчика и отдельные строительные работы.",
  // Общая стартовая цена не выводится: раздел объединяет разные технологии,
  // уровни готовности и типы объектов.
  suitableFor: [
    "Заказчики частных домов",
    "Застройщики многоквартирных домов",
    "Технические заказчики, официально уполномоченные на ведение объекта",
    "Объекты с разными технологиями строительства",
  ],
  benefits: [
    "Прямой договор с собственником, застройщиком или техническим заказчиком",
    "Единый исполнитель по объекту",
    "Поэтапная приёмка с отчётностью",
    "Контроль скрытых работ и исполнительная документация",
  ],
  included: [
    "Девять технологий частных домов",
    "Многоквартирные дома в качестве генерального подрядчика",
    "Генеральный подряд",
    "Монолитные работы",
    "Фундаменты",
    "Кладочные работы",
    "Кровельные работы",
    "Фасадные работы",
  ],
  excluded: [
    "Работа через посредников и неуполномоченных агентов",
    "Объекты без согласованной проектной основы",
    "Работы за рамками заключённого договора без дополнительного соглашения",
  ],
  technology: [
    "Девять технологий частных домов в каталоге раздела",
    "Четыре уровня готовности дома",
    "Монолитные работы и фундаменты как отдельные направления",
    "Кладка, кровля и фасад как отдельные направления",
  ],
  stages: STAGES_HOUSE,
  qualityControl: QC_FULL,
  documents: DOCS_FULL,
  timelineFactors: TIMELINE_HOUSE,
  priceCategoryIds: [
    "house_construction_work",
    "house_construction_materials",
  ] satisfies PriceCategory[],
  faqIds: FAQ_BASE,
  relatedSlugs: [
    "stroitelstvo-domov-pod-klyuch",
    "mnogokvartirnye-doma",
    "generalnyy-podryad",
    "monolitnye-raboty",
    "fundamenty",
    "kladochnye-raboty",
    "krovelnye-raboty",
    "fasadnye-raboty",
    
  ],
  illustrationKey: "direction-houses",
  estimateExampleItemIds: [
    "foundations-plita",
    "masonry-gazobeton-naruzh",
    "roofing-complex-utepl-metall",
    "facades-mokryy",
    "general_contracting-coordination",
  ],
  estimateExampleVolumes: {
    "foundations-plita": VOL(50),
    "masonry-gazobeton-naruzh": VOL(40),
    "roofing-complex-utepl-metall": VOL(160),
    "facades-mokryy": VOL(180),
  },
  estimateExampleNotes: {
    "foundations-plita": NOTE_BREAKDOWN,
  },
};

// ─────────────────────────────────────────────────────────────────────────
// Запись 2. /stroitelstvo-domov-pod-klyuch
// ─────────────────────────────────────────────────────────────────────────

const PAGE_HOUSES_TURNKEY: ServicePageData = {
  slug: "stroitelstvo-domov-pod-klyuch",
  route: "/stroitelstvo-domov-pod-klyuch",
  category: "construction",
  title: "Строительство домов под ключ",
  metaTitle:
    "Строительство частных домов под ключ — девять технологий — Шадов и партнёры",
  metaDescription:
    "Строительство частных домов под ключ по девяти технологиям. Четыре уровня готовности — от коробки до под ключ. Прямой договор и поэтапная приёмка.",
  h1: "Строительство частных домов под ключ в Москве и Московской области",
  description:
    "Минимальная стартовая цена относится к дому из СИП-панелей в комплектации «под ключ». Конкретная стоимость зависит от технологии, проекта и комплектации.",
  startingPrice: "от 44 000 ₽/м² за работы",
  suitableFor: [
    "Частные дома с проектной основой",
    "Заказчики, выбирающие технологию и уровень готовности",
    "Объекты с готовым проектом",
    "Объекты, для которых необходимо предварительное проектирование",
  ],
  benefits: [
    "Девять утверждённых технологий в одном разделе",
    "Четыре уровня готовности дома",
    "Прямой договор с собственником объекта",
    "Поэтапная приёмка и контроль скрытых работ",
  ],
  included: [
    "Изучение исходных данных и проекта",
    "Подготовка площадки",
    "Фундамент",
    "Несущие конструкции",
    "Перекрытия",
    "Кровля",
    "Окна и наружные двери",
    "Фасад",
    "Инженерные системы",
    "Черновая и чистовая отделка по выбранной комплектации",
    "Проверка и сдача дома",
  ],
  excluded: [
    "Мебель",
    "Кухня",
    "Бытовая техника",
    "Благоустройство",
    "Дорогостоящее оборудование",
    "Архитектурно-строительный проект, если он не заказан отдельно",
  ],
  technology: [
    "Девять технологий частных домов",
    "Четыре уровня готовности дома",
    "Таблица цен «только работы» и «работы с базовыми материалами»",
    "Состав каждого уровня готовности",
  ],
  stages: STAGES_HOUSE,
  qualityControl: QC_FULL,
  documents: DOCS_FULL,
  timelineFactors: TIMELINE_HOUSE,
  priceCategoryIds: [
    "house_construction_work",
    "house_construction_materials",
  ] satisfies PriceCategory[],
  faqIds: FAQ_BASE,
  relatedSlugs: [
    "karkasnye-doma",
    "doma-iz-gazobetona",
    "kirpichnye-doma",
    "monolitnye-doma",
    "fundamenty",
    "krovelnye-raboty",
    "fasadnye-raboty",
    
  ],
  illustrationKey: "direction-houses",
  estimateExampleItemIds: HOUSE_MASONRY_ESTIMATE_IDS,
  estimateExampleVolumes: HOUSE_MASONRY_ESTIMATE_VOL,
  estimateExampleNotes: HOUSE_MASONRY_NOTES,
};

// ─────────────────────────────────────────────────────────────────────────
// Записи 3–11. Девять технологий
// ─────────────────────────────────────────────────────────────────────────

type TechRule = {
  slug: string;
  h1: string;
  startingPrice: string;
  metaTitle: string;
  metaDescription: string;
  estimateIds: string[];
  estimateVol: Record<string, { value: number; label: "Демонстрационный объём" }>;
  estimateNotes: Record<string, string>;
};

const TECH_RULES: TechRule[] = [
  {
    slug: "karkasnye-doma",
    h1: "Строительство каркасных домов под ключ",
    startingPrice: "от 45 000 ₽/м² за работы",
    metaTitle: "Каркасные дома под ключ — Шадов и партнёры",
    metaDescription:
      "Строительство каркасных домов под ключ. Четыре уровня готовности, прямой договор и поэтапная приёмка.",
    estimateIds: HOUSE_LIGHT_ESTIMATE_IDS,
    estimateVol: HOUSE_LIGHT_ESTIMATE_VOL,
    estimateNotes: HOUSE_LIGHT_NOTES,
  },
  {
    slug: "doma-iz-sip-paneley",
    h1: "Строительство домов из СИП-панелей под ключ",
    startingPrice: "от 44 000 ₽/м² за работы",
    metaTitle: "Дома из СИП-панелей под ключ — Шадов и партнёры",
    metaDescription:
      "Строительство домов из СИП-панелей под ключ. Заводская готовность панелей и быстрый монтаж коробки.",
    estimateIds: HOUSE_LIGHT_ESTIMATE_IDS,
    estimateVol: HOUSE_LIGHT_ESTIMATE_VOL,
    estimateNotes: HOUSE_LIGHT_NOTES,
  },
  {
    slug: "doma-iz-brusa",
    h1: "Строительство домов из профилированного бруса",
    startingPrice: "от 48 000 ₽/м² за работы",
    metaTitle: "Дома из профилированного бруса — Шадов и партнёры",
    metaDescription:
      "Строительство домов из профилированного бруса. Четыре уровня готовности и поэтапная приёмка.",
    estimateIds: HOUSE_LIGHT_ESTIMATE_IDS,
    estimateVol: HOUSE_LIGHT_ESTIMATE_VOL,
    estimateNotes: HOUSE_LIGHT_NOTES,
  },
  {
    slug: "doma-iz-kleenogo-brusa",
    h1: "Строительство домов из клееного бруса",
    startingPrice: "от 58 000 ₽/м² за работы",
    metaTitle: "Дома из клееного бруса — Шадов и партнёры",
    metaDescription:
      "Строительство домов из клееного бруса заводского изготовления с подготовленными узлами.",
    estimateIds: HOUSE_LIGHT_ESTIMATE_IDS,
    estimateVol: HOUSE_LIGHT_ESTIMATE_VOL,
    estimateNotes: HOUSE_LIGHT_NOTES,
  },
  {
    slug: "doma-iz-gazobetona",
    h1: "Строительство домов из газобетона под ключ",
    startingPrice: "от 65 000 ₽/м² за работы",
    metaTitle: "Дома из газобетона под ключ — Шадов и партнёры",
    metaDescription:
      "Строительство домов из газобетона под ключ. Кладка с армированием, перемычками и армопоясом по проекту.",
    estimateIds: HOUSE_MASONRY_ESTIMATE_IDS,
    estimateVol: HOUSE_MASONRY_ESTIMATE_VOL,
    estimateNotes: HOUSE_MASONRY_NOTES,
  },
  {
    slug: "doma-iz-keramicheskih-blokov",
    h1: "Строительство домов из керамических блоков",
    startingPrice: "от 72 000 ₽/м² за работы",
    metaTitle: "Дома из керамических блоков — Шадов и партнёры",
    metaDescription:
      "Строительство домов из крупноформатных керамических блоков с перевязкой и узлами по проекту.",
    estimateIds: [
      "foundations-plita",
      "masonry-keramoblok",
      "masonry-armopoyas",
      "roofing-stropilka",
      "facades-mokryy",
    ],
    estimateVol: {
      "foundations-plita": VOL(40),
      "masonry-keramoblok": VOL(35),
      "masonry-armopoyas": VOL(4),
      "roofing-stropilka": VOL(150),
      "facades-mokryy": VOL(180),
    },
    estimateNotes: { "foundations-plita": NOTE_BREAKDOWN },
  },
  {
    slug: "kirpichnye-doma",
    h1: "Строительство кирпичных домов под ключ",
    startingPrice: "от 80 000 ₽/м² за работы",
    metaTitle: "Кирпичные дома под ключ — Шадов и партнёры",
    metaDescription:
      "Строительство кирпичных домов под ключ. Несущие и облицовочные конструкции по проекту.",
    estimateIds: [
      "foundations-plita",
      "masonry-ryadovoy-kirpich",
      "masonry-armopoyas",
      "roofing-stropilka",
      "facades-podgotovka",
    ],
    estimateVol: {
      "foundations-plita": VOL(50),
      "masonry-ryadovoy-kirpich": VOL(40),
      "masonry-armopoyas": VOL(5),
      "roofing-stropilka": VOL(160),
      "facades-podgotovka": VOL(200),
    },
    estimateNotes: { "foundations-plita": NOTE_BREAKDOWN },
  },
  {
    slug: "monolitnye-doma",
    h1: "Строительство монолитных железобетонных домов",
    startingPrice: "от 90 000 ₽/м² за работы",
    metaTitle: "Монолитные железобетонные дома — Шадов и партнёры",
    metaDescription:
      "Строительство монолитных железобетонных домов по разделу КЖ с инженерным и геодезическим контролем.",
    estimateIds: [
      "monolithic-fundament-plita",
      "monolithic-steny-zdaniya",
      "monolithic-perekrytie",
      "monolithic-armatura",
      "roofing-stropilka",
    ],
    estimateVol: {
      "monolithic-fundament-plita": VOL(50),
      "monolithic-steny-zdaniya": VOL(80),
      "monolithic-perekrytie": VOL(40),
      "monolithic-armatura": VOL(8),
      "roofing-stropilka": VOL(160),
    },
    estimateNotes: { "monolithic-fundament-plita": NOTE_BREAKDOWN },
  },
  {
    slug: "kombinirovannye-doma",
    h1: "Строительство комбинированных домов",
    startingPrice: "от 95 000 ₽/м² за работы",
    metaTitle: "Комбинированные дома — Шадов и партнёры",
    metaDescription:
      "Строительство комбинированных домов с сочетанием каменных, железобетонных и деревянных конструкций по проекту.",
    estimateIds: [
      "foundations-plita",
      "masonry-gazobeton-naruzh",
      "monolithic-perekrytie",
      "roofing-stropilka",
      "facades-mokryy",
    ],
    estimateVol: {
      "foundations-plita": VOL(45),
      "masonry-gazobeton-naruzh": VOL(30),
      "monolithic-perekrytie": VOL(35),
      "roofing-stropilka": VOL(150),
      "facades-mokryy": VOL(180),
    },
    estimateNotes: { "foundations-plita": NOTE_BREAKDOWN },
  },
];

const TECH_PAGES: ServicePageData[] = TECH_RULES.map((rule): ServicePageData => {
  const t = houseTech(rule.slug);
  return {
    slug: rule.slug,
    route: `/${rule.slug}`,
    category: "construction",
    title: t.name,
    metaTitle: rule.metaTitle,
    metaDescription: rule.metaDescription,
    h1: rule.h1,
    description: t.constructionPrinciple,
    startingPrice: rule.startingPrice,
    suitableFor: [
      "Частный дом по индивидуальному проекту",
      "Частный дом по готовому типовому проекту",
      "Заказчики, выбирающие конкретную технологию",
      "Объекты на разных типах оснований по результатам геологии",
    ],
    benefits: t.benefits,
    included: [
      "Изучение исходных данных",
      "Подготовка площадки",
      "Фундамент по проекту",
      "Возведение несущих конструкций по выбранной технологии",
      "Перекрытия по проекту",
      "Кровля",
      "Окна и наружные двери на уровнях от тёплого контура",
      "Фасадная отделка на уровнях от под чистовую отделку",
      "Инженерные системы на уровнях от под чистовую отделку",
      "Отделочные работы базового уровня для комплектации «под ключ»",
    ],
    excluded: [
      "Мебель и кухня",
      "Бытовая техника",
      "Благоустройство участка",
      "Дорогостоящее оборудование",
      "Этапы, выходящие за выбранный уровень готовности",
    ],
    technology: [
      `Конструктивный принцип: ${t.constructionPrinciple}`,
      `Стены: ${t.wallSystem.join("; ")}`,
      `Перекрытия: ${t.floorSystems.join("; ")}`,
      `Кровля: ${t.roofOptions.join("; ")}`,
      `Инженерные системы: ${t.engineeringSystems.join("; ")}`,
      `Подходящие фундаменты: ${t.suitableFoundations.join("; ")}`,
    ],
    stages: t.constructionStages,
    qualityControl: QC_FULL,
    documents: DOCS_FULL,
    timelineFactors: TIMELINE_HOUSE,
    priceCategoryIds: [
      "house_construction_work",
      "house_construction_materials",
    ] satisfies PriceCategory[],
    faqIds: FAQ_BASE,
    relatedSlugs: [
      "stroitelstvo-domov-pod-klyuch",
      ...relatedFor(rule.slug),
      
    ],
    illustrationKey: "direction-houses",
    estimateExampleItemIds: rule.estimateIds,
    estimateExampleVolumes: rule.estimateVol,
    estimateExampleNotes: rule.estimateNotes,
  };
});

// ─────────────────────────────────────────────────────────────────────────
// Записи 12–18. Многоквартирные / генподряд / монолит / фундамент / кладка / кровля / фасад
// ─────────────────────────────────────────────────────────────────────────

const PAGE_MKD: ServicePageData = {
  slug: "mnogokvartirnye-doma",
  route: "/mnogokvartirnye-doma",
  category: "construction",
  title: "Многоквартирные дома",
  metaTitle:
    "Строительство многоквартирных домов — генеральный подрядчик — Шадов и партнёры",
  metaDescription:
    "Строительство многоквартирных домов в качестве генерального подрядчика. Организация строительного производства, исполнительная документация, взаимодействие с техническим заказчиком.",
  h1: "Строительство многоквартирных домов в качестве генерального подрядчика",
  description:
    "Стоимость рассчитывается по проекту. Компания принимает функции генерального подрядчика по прямому договору с застройщиком или официально уполномоченным техническим заказчиком.",
  // startingPrice не задаётся: «Стоимость рассчитывается по проекту».
  suitableFor: [
    "Застройщики многоквартирных домов",
    "Технические заказчики, официально уполномоченные на ведение объекта",
    "Объекты с готовой проектной документацией",
  ],
  benefits: [
    "Прямой договор с застройщиком или техническим заказчиком",
    "Единый центр ответственности по объекту",
    "Поэтапная приёмка и отчётность",
    "Исполнительная документация по разделам проекта",
  ],
  included: [
    "Организация строительного производства",
    "Календарный график",
    "Мобилизация",
    "Управление исполнителями",
    "Охрана труда",
    "Входной контроль материалов",
    "Геодезический контроль",
    "Лабораторные испытания, когда они предусмотрены проектом и нормативными требованиями",
    "Исполнительная документация",
    "Акты скрытых работ",
    "Контроль объёмов",
    "Сдача этапов",
    "Взаимодействие с техническим заказчиком",
  ],
  excluded: [
    "Работа без согласованного проекта",
    "Работа через посредников и неуполномоченных агентов",
    "Работы, не предусмотренные договором",
  ],
  technology: [
    "Организация строительного производства по ПОС и ППР",
    "Управление субподрядчиками по графику",
    "Документальный и геодезический контроль",
    "Взаимодействие с техническим заказчиком и контролирующими лицами",
  ],
  stages: [
    "Изучение проектной документации",
    "Согласование графика и ресурсов",
    "Мобилизация",
    "Выполнение работ по разделам проекта",
    "Поэтапная приёмка и оформление актов",
    "Сдача объекта",
  ],
  qualityControl: QC_FULL,
  documents: DOCS_FULL,
  timelineFactors: TIMELINE_HOUSE,
  priceCategoryIds: ["general_contracting", "monolithic"] satisfies PriceCategory[],
  faqIds: FAQ_BASE,
  relatedSlugs: [
    "generalnyy-podryad",
    "monolitnye-raboty",
    "fundamenty",
    "kladochnye-raboty",
    
  ],
  illustrationKey: "hero-construction",
  estimateExampleItemIds: [
    "general_contracting-coordination",
    "general_contracting-pm",
    "general_contracting-qa-engineer",
    "general_contracting-docs",
    "monolithic-fundament-plita",
  ],
  estimateExampleVolumes: {
    "general_contracting-pm": VOL(12),
    "general_contracting-qa-engineer": VOL(12),
    "general_contracting-docs": VOL(12),
    "monolithic-fundament-plita": VOL(200),
  },
  estimateExampleNotes: {
    "general_contracting-coordination": NOTE_BREAKDOWN,
  },
};

const PAGE_GP: ServicePageData = {
  slug: "generalnyy-podryad",
  route: "/generalnyy-podryad",
  category: "construction",
  title: "Генеральный подряд",
  metaTitle: "Генеральный подряд — единый центр ответственности — Шадов и партнёры",
  metaDescription:
    "Генеральный подряд с единым центром ответственности. Компания является ответственным исполнителем по прямому договору с заказчиком.",
  h1: "Генеральный подряд с единым центром ответственности",
  description:
    "Компания является ответственным исполнителем по прямому договору с заказчиком. С посредниками и неуполномоченными агентами договоры не заключаем.",
  startingPrice: "от 3% стоимости СМР",
  suitableFor: [
    "Частные объекты с несколькими подрядчиками",
    "Многоквартирные дома",
    "Застройщики и технические заказчики",
    "Объекты с расширенной документацией",
  ],
  benefits: [
    "Прямой договор с заказчиком",
    "Единый центр ответственности",
    "Назначенный руководитель проекта",
    "Документальный и инженерный контроль",
  ],
  included: [
    "Прямой договор",
    "Единый центр ответственности",
    "Руководитель проекта",
    "Календарный график",
    "Координация участников",
    "Контроль объёмов",
    "Логистика",
    "Документация",
    "Охрана труда",
    "Согласование изменений",
    "Промежуточная приёмка",
    "Сдача результата",
  ],
  excluded: [
    "Работа через посредников и неуполномоченных агентов",
    "Скрытые комиссионные платежи",
    "Изменения без согласования с заказчиком",
  ],
  technology: [
    "Назначение руководителя проекта",
    "Согласование графика и логистики",
    "Координация субподрядных организаций",
    "Контроль объёмов и качества",
    "Документальное сопровождение объекта",
  ],
  stages: [
    "Изучение исходных данных",
    "Назначение руководителя проекта",
    "Согласование графика и ресурсов",
    "Мобилизация",
    "Координация исполнителей",
    "Промежуточные приёмки",
    "Сдача результата",
  ],
  qualityControl: QC_FULL,
  documents: DOCS_FULL,
  timelineFactors: TIMELINE_HOUSE,
  priceCategoryIds: ["general_contracting"] satisfies PriceCategory[],
  faqIds: FAQ_BASE,
  relatedSlugs: [
    "mnogokvartirnye-doma",
    "stroitelstvo-domov-pod-klyuch",
    "monolitnye-raboty",
    
  ],
  illustrationKey: "hero-construction",
  estimateExampleItemIds: [
    "general_contracting-coordination",
    "general_contracting-full",
    "general_contracting-pm",
    "general_contracting-qa-engineer",
    "general_contracting-docs",
  ],
  estimateExampleVolumes: {
    "general_contracting-pm": VOL(12),
    "general_contracting-qa-engineer": VOL(12),
    "general_contracting-docs": VOL(12),
  },
  estimateExampleNotes: {
    "general_contracting-coordination": NOTE_BREAKDOWN,
  },
};

const PAGE_MONOLITH: ServicePageData = {
  slug: "monolitnye-raboty",
  route: "/monolitnye-raboty",
  category: "construction",
  title: "Монолитные работы",
  metaTitle:
    "Монолитные работы — инженерный и документальный контроль — Шадов и партнёры",
  metaDescription:
    "Монолитные работы по разделу КЖ: опалубка, армирование, бетонирование, уход за бетоном, исполнительная документация.",
  h1: "Монолитные работы с инженерным, геодезическим и документальным контролем",
  description:
    "Комплексные монолитные работы по разделу КЖ: фундаменты, стены, перекрытия, колонны и лестницы.",
  startingPrice: "от 18 000 ₽/м³ за комплексные работы по фундаментной плите",
  suitableFor: [
    "Монолитные конструкции частных домов",
    "Монолитные элементы многоквартирных домов",
    "Объекты, выполняемые в составе генерального подряда",
  ],
  benefits: [
    "Работа по разделу КЖ",
    "Геодезический контроль на ключевых этапах",
    "Приёмка скрытых работ по актам",
    "Уход за бетоном по технологии",
  ],
  included: [
    "Изучение раздела КЖ",
    "Геодезическая разбивка",
    "Подготовка основания",
    "Опалубка",
    "Армирование",
    "Проверка закладных и защитного слоя",
    "Бетонирование",
    "Уход за бетоном",
    "Распалубка",
    "Геодезическая проверка",
    "Исполнительная документация",
  ],
  excluded: [
    "Разработка раздела КЖ, если не заказана отдельно",
    "Работы за пределами утверждённого объёма",
    "Архитектурно-отделочные работы",
  ],
  technology: [
    "Опалубочные системы по проекту",
    "Армирование по разделу КЖ",
    "Бетонирование классов B25 и выше по проекту",
    "Уход за бетоном по технологии",
    "Геодезический контроль на ключевых этапах",
  ],
  stages: STAGES_MONOLITHIC,
  qualityControl: QC_FULL,
  documents: DOCS_FULL,
  timelineFactors: TIMELINE_TRADE,
  priceCategoryIds: ["monolithic"] satisfies PriceCategory[],
  faqIds: FAQ_BASE,
  relatedSlugs: [
    "fundamenty",
    "monolitnye-doma",
    "generalnyy-podryad",
    "kladochnye-raboty",
    
  ],
  illustrationKey: "direction-monolith",
  estimateExampleItemIds: [
    "monolithic-fundament-plita",
    "monolithic-armatura",
    "monolithic-opalubka-montazh",
    "monolithic-priem-betona",
    "monolithic-uhod-za-betonom",
  ],
  estimateExampleVolumes: {
    "monolithic-fundament-plita": VOL(60),
    "monolithic-armatura": VOL(5),
    "monolithic-opalubka-montazh": VOL(200),
    "monolithic-priem-betona": VOL(60),
    "monolithic-uhod-za-betonom": VOL(120),
  },
  estimateExampleNotes: {
    "monolithic-fundament-plita": NOTE_BREAKDOWN,
  },
};

const PAGE_FOUNDATIONS: ServicePageData = {
  slug: "fundamenty",
  route: "/fundamenty",
  category: "construction",
  title: "Фундаменты",
  metaTitle: "Фундаменты — частные и многоквартирные здания — Шадов и партнёры",
  metaDescription:
    "Устройство фундаментов разных типов по проекту: плитные, ленточные, свайно-ростверковые, УШП. Гидроизоляция, дренаж и утепление.",
  h1: "Устройство фундаментов для частных и многоквартирных зданий",
  description:
    "Тип фундамента выбирается по проекту с учётом конструкций здания и характеристик основания.",
  // Главную универсальную цену не выводим: единицы и типы различаются.
  suitableFor: [
    "Частные дома",
    "Многоквартирные здания",
    "Объекты в составе генерального подряда",
    "Объекты с готовой геологией и проектом",
  ],
  benefits: [
    "Подбор типа фундамента по проекту и данным основания",
    "Гидро- и теплоизоляция по проекту",
    "Дренажные решения по проекту",
    "Контроль отметок и приёмка скрытых работ",
  ],
  included: [
    "Обследование участка",
    "Геология и геодезия, если предусмотрены проектом",
    "Подготовка основания",
    "Песчаная и щебёночная подготовка",
    "Подбетонка",
    "Гидроизоляция",
    "Утепление",
    "Армирование",
    "Опалубка",
    "Бетонирование",
    "Вводы инженерных сетей",
    "Дренаж",
    "Контроль отметок",
    "Уход за бетоном",
  ],
  excluded: [
    "Разработка проекта фундамента, если не заказана отдельно",
    "Работы по благоустройству",
    "Возведение надземных конструкций",
  ],
  technology: [
    "Плитные фундаменты по проекту",
    "Ленточные фундаменты",
    "Свайно-ростверковые фундаменты",
    "Утеплённая шведская плита",
    "Гидро- и теплоизоляция по проекту",
    "Дренажные системы",
  ],
  stages: STAGES_FOUNDATIONS,
  qualityControl: QC_FULL,
  documents: DOCS_FULL,
  timelineFactors: TIMELINE_TRADE,
  priceCategoryIds: ["foundations"] satisfies PriceCategory[],
  faqIds: FAQ_BASE,
  relatedSlugs: [
    "monolitnye-raboty",
    "kladochnye-raboty",
    "stroitelstvo-domov-pod-klyuch",
    
  ],
  illustrationKey: "direction-monolith",
  estimateExampleItemIds: [
    "foundations-razrabotka-ekskavator",
    "foundations-pesok",
    "foundations-betonnaya-podgotovka",
    "foundations-plita",
    "foundations-obmazochnaya-gidro",
    "foundations-pristennyy-drenazh",
  ],
  estimateExampleVolumes: {
    "foundations-razrabotka-ekskavator": VOL(80),
    "foundations-pesok": VOL(80),
    "foundations-betonnaya-podgotovka": VOL(8),
    "foundations-plita": VOL(50),
    "foundations-obmazochnaya-gidro": VOL(120),
    "foundations-pristennyy-drenazh": VOL(40),
  },
  estimateExampleNotes: {
    "foundations-plita": NOTE_BREAKDOWN,
  },
};

const PAGE_MASONRY: ServicePageData = {
  slug: "kladochnye-raboty",
  route: "/kladochnye-raboty",
  category: "construction",
  title: "Кладочные работы",
  metaTitle:
    "Кладочные работы — контроль геометрии и узлов — Шадов и партнёры",
  metaDescription:
    "Кладка стен и перегородок из газобетона, керамических блоков и кирпича. Армирование, перемычки, армопояса.",
  h1: "Кладочные работы с контролем геометрии, перевязки и конструктивных узлов",
  description:
    "Кладка несущих и ограждающих конструкций из утверждённых материалов с контролем геометрии и приёмкой скрытых работ.",
  startingPrice: "от 7 000 ₽/м³",
  suitableFor: [
    "Частные дома",
    "Многоквартирные здания",
    "Перегородки в составе ремонта",
    "Объекты в составе генерального подряда",
  ],
  benefits: [
    "Подбор кладочного материала по проекту",
    "Контроль геометрии и перевязки",
    "Армирование и армопояса по проекту",
    "Защита незавершённой кладки",
  ],
  included: [
    "Кладка газобетона",
    "Кладка газосиликата",
    "Кладка пенобетона",
    "Кладка керамических блоков",
    "Кладка керамзитобетона",
    "Кладка кирпича",
    "Перегородки",
    "Облицовочная кладка",
    "Армирование рядов",
    "Монтаж перемычек",
    "Устройство армопоясов",
  ],
  excluded: [
    "Устройство фундамента",
    "Кровельные работы",
    "Отделка фасада",
    "Внутренняя отделка",
  ],
  technology: [
    "Подготовка основания и гидроизоляция",
    "Контроль первого ряда",
    "Контроль горизонтальности и вертикальности",
    "Перевязка по проекту",
    "Армирование и перемычки",
    "Армопояса под перекрытиями",
    "Защита незавершённой кладки",
  ],
  stages: STAGES_MASONRY,
  qualityControl: [
    ...QC_TRADE,
    "Контроль первого ряда",
    "Контроль перевязки",
    "Фотофиксация скрытых элементов",
  ],
  documents: DOCS_TRADE,
  timelineFactors: TIMELINE_TRADE,
  priceCategoryIds: ["masonry"] satisfies PriceCategory[],
  faqIds: FAQ_BASE,
  relatedSlugs: [
    "fundamenty",
    "monolitnye-raboty",
    "krovelnye-raboty",
    "fasadnye-raboty",
    
  ],
  illustrationKey: "direction-houses",
  estimateExampleItemIds: [
    "masonry-gazobeton-naruzh",
    "masonry-peregorodki-gazobeton",
    "masonry-armirovanie",
    "masonry-gazobeton-peremychka",
    "masonry-armopoyas",
  ],
  estimateExampleVolumes: {
    "masonry-gazobeton-naruzh": VOL(40),
    "masonry-peregorodki-gazobeton": VOL(60),
    "masonry-armirovanie": VOL(200),
    "masonry-gazobeton-peremychka": VOL(12),
    "masonry-armopoyas": VOL(4),
  },
  estimateExampleNotes: {
    "masonry-gazobeton-naruzh": NOTE_BREAKDOWN,
  },
};

const PAGE_ROOFING: ServicePageData = {
  slug: "krovelnye-raboty",
  route: "/krovelnye-raboty",
  category: "construction",
  title: "Кровельные работы",
  metaTitle: "Кровельные работы — частные дома и здания — Шадов и партнёры",
  metaDescription:
    "Кровельные работы: стропильная система, утепление, пароизоляция, гидроветрозащита, кровельное покрытие, водосток.",
  h1: "Кровельные работы для частных домов и зданий",
  description:
    "Полный комплекс кровельных работ: стропильная система, утепление, гидро- и пароизоляция, кровельное покрытие и водосточная система.",
  startingPrice: "от 3 500 ₽/м² за комплекс холодной скатной кровли",
  suitableFor: [
    "Частные дома",
    "Многоквартирные здания",
    "Скатные и плоские кровли",
    "Реконструкция существующей кровли по проекту",
  ],
  benefits: [
    "Подбор кровельной системы по проекту",
    "Контроль слоёв кровельного пирога",
    "Водосточная система и снегозадержание",
    "Вентиляция подкровельного пространства",
  ],
  included: [
    "Стропильная система",
    "Пароизоляция",
    "Утепление",
    "Гидроветрозащита",
    "Обрешётка или сплошное основание",
    "Кровельное покрытие",
    "Примыкания",
    "Водосточная система",
    "Снегозадержание",
    "Вентиляция подкровельного пространства",
  ],
  excluded: [
    "Демонтаж старой кровли, если не предусмотрен договором",
    "Внутренние работы под кровлей",
    "Фасадные работы",
  ],
  technology: [
    "Скатные кровли",
    "Плоские кровли",
    "Утеплённый кровельный пирог",
    "Холодная скатная кровля",
    "21 отдельная работа в каталоге",
    "7 комплексных кровельных решений",
  ],
  stages: STAGES_ROOFING,
  qualityControl: QC_TRADE,
  documents: DOCS_TRADE,
  timelineFactors: TIMELINE_TRADE,
  priceCategoryIds: ["roofing"] satisfies PriceCategory[],
  faqIds: FAQ_BASE,
  relatedSlugs: [
    "fasadnye-raboty",
    "kladochnye-raboty",
    "stroitelstvo-domov-pod-klyuch",
    
  ],
  illustrationKey: "direction-houses",
  estimateExampleItemIds: [
    "roofing-stropilka",
    "roofing-paroizolyatsiya",
    "roofing-uteplenie",
    "roofing-gidrovetrozaschita",
    "roofing-metallocherepitsa",
    "roofing-vodostok",
  ],
  estimateExampleVolumes: {
    "roofing-stropilka": VOL(150),
    "roofing-paroizolyatsiya": VOL(150),
    "roofing-uteplenie": VOL(150),
    "roofing-gidrovetrozaschita": VOL(150),
    "roofing-metallocherepitsa": VOL(150),
    "roofing-vodostok": VOL(40),
  },
  estimateExampleNotes: {
    "roofing-stropilka": NOTE_BREAKDOWN,
  },
};

const PAGE_FACADES: ServicePageData = {
  slug: "fasadnye-raboty",
  route: "/fasadnye-raboty",
  category: "construction",
  title: "Фасадные работы",
  metaTitle: "Фасадные работы и наружная отделка — Шадов и партнёры",
  metaDescription:
    "Фасадные работы: штукатурные системы, мокрый фасад, сайдинг, планкен, клинкер, вентилируемые фасады, утепление.",
  h1: "Фасадные работы и наружная отделка зданий",
  description:
    "Полный комплекс фасадных работ: подготовка основания, утепление, монтаж фасадной системы и декоративная отделка.",
  startingPrice: "от 1 800 ₽/м² за монтаж винилового сайдинга",
  suitableFor: [
    "Частные дома",
    "Многоквартирные здания",
    "Реконструкция существующего фасада по проекту",
    "Объекты в составе генерального подряда",
  ],
  benefits: [
    "Подбор фасадной системы по проекту",
    "Утепление по проекту",
    "Контроль примыканий и оформления проёмов",
    "Защита основания на время работ",
  ],
  included: [
    "Подготовка основания",
    "Штукатурные фасады",
    "Мокрый фасад",
    "Декоративная штукатурка",
    "Окраска",
    "Сайдинг",
    "Планкен",
    "Клинкер",
    "Облицовочный кирпич",
    "Вентилируемые фасады",
    "Натуральный камень",
    "Утепление",
  ],
  excluded: [
    "Кровельные работы",
    "Внутренние работы",
    "Архитектурный проект, если не заказан отдельно",
  ],
  technology: [
    "Подготовка основания",
    "Утепление по проекту",
    "Армирующий слой или подсистема",
    "Монтаж облицовки или декоративного покрытия",
    "Оформление проёмов и примыканий",
  ],
  stages: STAGES_FACADES,
  qualityControl: QC_TRADE,
  documents: DOCS_TRADE,
  timelineFactors: TIMELINE_TRADE,
  priceCategoryIds: ["facades"] satisfies PriceCategory[],
  faqIds: FAQ_BASE,
  relatedSlugs: [
    "krovelnye-raboty",
    "kladochnye-raboty",
    "stroitelstvo-domov-pod-klyuch",
    
  ],
  illustrationKey: "direction-houses",
  estimateExampleItemIds: [
    "facades-podgotovka",
    "facades-uteplenie-min-vata",
    "facades-mokryy",
    "facades-pokraska",
  ],
  estimateExampleVolumes: {
    "facades-podgotovka": VOL(200),
    "facades-uteplenie-min-vata": VOL(200),
    "facades-mokryy": VOL(200),
    "facades-pokraska": VOL(200),
  },
  estimateExampleNotes: {
    "facades-mokryy": "Выбор фасадной системы зависит от проекта.",
  },
};

// ─────────────────────────────────────────────────────────────────────────
// Экспорт 18 страниц.
// ─────────────────────────────────────────────────────────────────────────

export const CONSTRUCTION_SERVICE_PAGES: ServicePageData[] = [
  PAGE_STROITELSTVO,
  PAGE_HOUSES_TURNKEY,
  ...TECH_PAGES,
  PAGE_MKD,
  PAGE_GP,
  PAGE_MONOLITH,
  PAGE_FOUNDATIONS,
  PAGE_MASONRY,
  PAGE_ROOFING,
  PAGE_FACADES,
];

if (CONSTRUCTION_SERVICE_PAGES.length !== 18) {
  throw new Error(
    `service-pages-construction: ожидается 18 страниц, найдено ${CONSTRUCTION_SERVICE_PAGES.length}`,
  );
}
