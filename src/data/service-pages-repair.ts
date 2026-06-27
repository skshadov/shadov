/**
 * Подэтап 2.3A — наполнение десяти страниц ремонта (утверждённые формулировки).
 *
 * Десять маршрутов раздела «Ремонт». Отдельный маршрут для эксклюзивного
 * ремонта не создаётся: пакет «Эксклюзивный ремонт — от 65 000 ₽/м²»
 * показывается только на /remont, /remont-pod-klyuch и /prices.
 *
 * Источники цен:
 *   - repair_packages — комплексные пакеты;
 *   - additional_repairs — черновой ремонт и чистовая отделка.
 *
 * Примеры структуры сметы формируются ТОЛЬКО через estimateExampleItemIds
 * по явному перечню релевантных позиций из prices.ts. Автоматический выбор
 * первых строк ценовой категории запрещён.
 */

import type { ServicePageData } from "@/types/services";
import { REPAIR_PACKAGES } from "./repair-packages";

const NBSP = "\u00A0";

function pkgPriceLabel(id: string, unitLabel?: string): string {
  const pkg = REPAIR_PACKAGES.find((p) => p.id === id);
  if (!pkg) return "";
  const price = pkg.priceFrom.toLocaleString("ru-RU").replace(/\s/g, NBSP);
  const unit = unitLabel ?? pkg.unit;
  return `от${NBSP}${price}${NBSP}₽/${unit} за работы`;
}

/** Стартовая цена для /chernovoy-remont и /chistovaya-otdelka — из категории
 *  additional_repairs (см. prices.ts: 10 000 и 8 000 ₽/м² пола соответственно). */
function additionalStartingPrice(value: number, unitLabel: string): string {
  return `от${NBSP}${value.toLocaleString("ru-RU").replace(/\s/g, NBSP)}${NBSP}₽/${unitLabel} за работы`;
}

const SHARED_STAGES = [
  "Получение проекта или планов, предварительная оценка задачи",
  "Выезд и обследование объекта",
  "Подготовка подробной сметы и графика этапов",
  "Подписание договора и оплата первого этапа",
  "Выполнение работ с ежедневной отчётностью",
  "Поэтапная приёмка с актами и фотофиксацией скрытых работ",
  "Сдача объекта с исполнительной документацией",
];

const SHARED_QUALITY = [
  "Поэтапная приёмка работ с актами",
  "Фотофиксация и акты на все скрытые работы до закрытия конструкций",
  "Контроль геометрии и уровней инструментальными средствами",
  "Опрессовка и пусконаладка инженерных систем",
  "Финальная приёмка с участием заказчика",
];

const SHARED_DOCS = [
  "Договор подряда с приложениями",
  "Согласованная смета и план-график работ",
  "Технические условия и согласования, если требуются",
  "Архитектурный или дизайн-проект — при наличии",
];

const SHARED_TIMELINE = [
  "Площадь и геометрия помещения",
  "Сложность инженерных решений",
  "Объём перепланировки и демонтажа",
  "Условия доступа на объект",
  "Сроки поставки материалов и оборудования",
  "Согласование заказчиком этапов и решений",
];

const v = (entries: Array<[string, number]>) => {
  const out: Record<string, { value: number }> = {};
  for (const [id, value] of entries) out[id] = { value };
  return out;
};

function packageBased(opts: {
  slug: string;
  packageId: string;
  title: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  description: string;
  suitableFor: string[];
  benefits: string[];
  technology: string[];
  related: string[];
  estimateExampleItemIds: string[];
  estimateExampleVolumes?: Record<string, { value: number }>;
  estimateExampleNotes?: Record<string, string>;
}): ServicePageData {
  const pkg = REPAIR_PACKAGES.find((p) => p.id === opts.packageId)!;
  return {
    slug: opts.slug,
    route: `/${opts.slug}`,
    category: "repair",
    title: opts.title,
    metaTitle: opts.metaTitle,
    metaDescription: opts.metaDescription,
    h1: opts.h1,
    description: opts.description,
    startingPrice: pkgPriceLabel(opts.packageId),
    suitableFor: opts.suitableFor,
    benefits: opts.benefits,
    included: pkg.included,
    excluded: pkg.excluded,
    packages: [opts.packageId],
    technology: opts.technology,
    stages: SHARED_STAGES,
    qualityControl: SHARED_QUALITY,
    documents: SHARED_DOCS,
    timelineFactors: SHARED_TIMELINE,
    priceCategoryIds: ["repair_packages"],
    faqIds: [
      "calc-without-visit",
      "contract-price",
      "payment-stages",
      "materials-procurement",
      "additional-works",
      "hidden-works",
    ],
    relatedSlugs: opts.related,
    estimateExampleItemIds: opts.estimateExampleItemIds,
    estimateExampleVolumes: opts.estimateExampleVolumes,
    estimateExampleNotes: opts.estimateExampleNotes,
  };
}

export const REPAIR_SERVICE_PAGES: ServicePageData[] = [
  // 1) /remont — обзорная страница раздела
  {
    slug: "remont",
    route: "/remont",
    category: "repair",
    title: "Ремонт",
    metaTitle: "Ремонт квартир и частных домов — Шадов и партнёры",
    metaDescription:
      "Ремонт квартир и частных домов в Москве и Московской области. Семь пакетов от 6 500 до 65 000 ₽/м² за работы, прямой договор, поэтапная оплата.",
    h1: "Ремонт квартир и частных домов в Москве и Московской области",
    description:
      "Полный цикл ремонтных работ от обследования и подготовки сметы до сдачи объекта. Прямой договор с заказчиком, поэтапная оплата и контроль скрытых работ по актам.",
    startingPrice: pkgPriceLabel("cosmetic"),
    suitableFor: [
      "Квартиры в новостройках и вторичном жилье",
      "Частные дома и таунхаусы",
      "Апартаменты и студии",
      "Коммерческие помещения и офисы",
      "Помещения после прежнего ремонта",
    ],
    benefits: [
      "Прямой договор с заказчиком без посредников",
      "Поэтапная оплата по фактически принятым работам",
      "Ежедневная отчётность по объекту",
      "Контроль скрытых работ по актам с фотофиксацией",
      "Семь пакетов: от косметического до эксклюзивного",
    ],
    included: [
      "Обследование объекта и подготовка сметы",
      "Демонтажные работы и вывоз строительного мусора",
      "Электромонтажные и сантехнические работы по выбранной комплектации",
      "Подготовка стен, полов и потолков под финишную отделку",
      "Финишная отделка по выбранному пакету",
      "Установка дверей и сантехнических приборов",
      "Пусконаладка инженерных систем",
      "Финишная уборка и сдача объекта",
    ],
    excluded: [
      "Авторский дизайн-проект (по отдельному договору)",
      "Мебель, кухня, бытовая техника",
      "Эксклюзивные материалы по индивидуальному заказу",
      "Стоимость отделочных и инженерных материалов",
    ],
    packages: ["cosmetic", "econom", "standard", "euro", "business", "premium", "exclusive"],
    technology: [
      "Стандартные строительные технологии с применением профессионального инструмента",
      "Электромонтаж по правилам устройства электроустановок",
      "Сантехнические системы с опрессовкой и контролем герметичности",
      "Подготовка оснований и финишная отделка по выбранному пакету",
    ],
    stages: SHARED_STAGES,
    qualityControl: SHARED_QUALITY,
    documents: SHARED_DOCS,
    timelineFactors: SHARED_TIMELINE,
    priceCategoryIds: ["repair_packages", "additional_repairs"],
    faqIds: [
      "calc-without-visit",
      "exact-estimate-needs",
      "contract-price",
      "payment-stages",
      "materials-procurement",
      "additional-works",
      "hidden-works",
      "single-works",
    ],
    relatedSlugs: [
      "remont-pod-klyuch",
      "chernovoy-remont",
      "chistovaya-otdelka",
      "elektromontazh",
      "santehnika",
    ],
    // Пример без пакетных тарифов — только реальные операции сметы.
    estimateExampleItemIds: [
      "demolition-kompleksnyy",
      "finishing_walls-shtukaturka-mayaki",
      "finishing_floors-polusukhaya",
      "electrical-chernovaya-tochka",
      "plumbing-kompleksnaya-tochka",
      "tiling-standart-keram",
    ],
    estimateExampleVolumes: v([
      ["demolition-kompleksnyy", 60],
      ["finishing_walls-shtukaturka-mayaki", 180],
      ["finishing_floors-polusukhaya", 60],
      ["electrical-chernovaya-tochka", 40],
      ["plumbing-kompleksnaya-tochka", 8],
      ["tiling-standart-keram", 25],
    ]),
  },

  // 2) /remont-pod-klyuch
  {
    slug: "remont-pod-klyuch",
    route: "/remont-pod-klyuch",
    category: "repair",
    title: "Ремонт под ключ",
    metaTitle: "Ремонт под ключ — комплексный подряд | Шадов и партнёры",
    metaDescription:
      "Комплексный ремонт квартиры или дома с единым ответственным подрядчиком. Семь пакетов, фиксированная смета, поэтапная оплата.",
    h1: "Комплексный ремонт квартиры или дома с единым ответственным подрядчиком",
    description:
      "Полный комплекс ремонтных работ с фиксированной сметой и поэтапной оплатой. Семь утверждённых пакетов с разным уровнем инженерных систем и отделки.",
    startingPrice: pkgPriceLabel("econom"),
    suitableFor: [
      "Новые квартиры без отделки и предчистовые объекты",
      "Вторичное жильё с полной заменой инженерных систем",
      "Частные дома и таунхаусы под ключ",
      "Коммерческие помещения и апартаменты",
    ],
    benefits: [
      "Семь пакетов с зафиксированной стоимостью работ",
      "Прямой договор с заказчиком",
      "Поэтапная оплата по принятым этапам",
      "Ежедневная отчётность и фотофиксация",
      "Контроль скрытых работ по актам",
      "Возможность закупки материалов компанией или заказчиком",
    ],
    included: [
      "Обследование объекта и подготовка подробной сметы",
      "Демонтажные работы и вывоз мусора",
      "Электромонтаж по выбранному пакету",
      "Замена сантехнических систем по выбранному пакету",
      "Подготовка оснований и финишная отделка по выбранному пакету",
      "Установка дверей, сантехники и подключение приборов",
      "Пусконаладка инженерных систем и сдача объекта",
    ],
    excluded: [
      "Авторский дизайн-проект (по отдельному договору)",
      "Мебель, кухня и бытовая техника",
      "Эксклюзивные отделочные материалы по индивидуальному заказу",
      "Стоимость отделочных и инженерных материалов",
    ],
    packages: ["cosmetic", "econom", "standard", "euro", "business", "premium", "exclusive"],
    technology: [
      "Стандартные строительные технологии",
      "Электромонтаж по правилам устройства электроустановок",
      "Сантехнические работы с опрессовкой и контролем герметичности",
      "Подготовка оснований по уровню в соответствии с выбранным пакетом",
      "Финишная отделка по выбранному пакету и согласованным решениям",
    ],
    stages: SHARED_STAGES,
    qualityControl: SHARED_QUALITY,
    documents: SHARED_DOCS,
    timelineFactors: SHARED_TIMELINE,
    priceCategoryIds: ["repair_packages"],
    faqIds: [
      "calc-without-visit",
      "contract-price",
      "payment-stages",
      "materials-procurement",
      "additional-works",
      "hidden-works",
      "documents-handover",
    ],
    relatedSlugs: [
      "kosmeticheskiy-remont",
      "ekonom-remont",
      "standartnyy-remont",
      "evroremont",
      "biznes-remont",
      "premialnyy-remont",
    ],
    estimateExampleItemIds: [
      "demolition-kompleksnyy",
      "finishing_walls-shtukaturka-mayaki",
      "finishing_floors-polusukhaya",
      "electrical-chernovaya-tochka",
      "plumbing-kompleksnaya-tochka",
      "finishing_walls-shpaklevka-pokraska",
    ],
    estimateExampleVolumes: v([
      ["demolition-kompleksnyy", 60],
      ["finishing_walls-shtukaturka-mayaki", 180],
      ["finishing_floors-polusukhaya", 60],
      ["electrical-chernovaya-tochka", 40],
      ["plumbing-kompleksnaya-tochka", 8],
      ["finishing_walls-shpaklevka-pokraska", 180],
    ]),
  },

  // 3) /kosmeticheskiy-remont
  packageBased({
    slug: "kosmeticheskiy-remont",
    packageId: "cosmetic",
    title: "Косметический ремонт",
    h1: "Косметический ремонт квартиры или помещения",
    metaTitle: "Косметический ремонт — от 6 500 ₽/м² | Шадов и партнёры",
    metaDescription:
      "Косметический ремонт квартир и помещений: подготовка стен, окраска, обои, замена напольных покрытий. Без замены инженерных систем.",
    description:
      "Освежение помещения без замены инженерных систем и без перепланировки. Финишная отделка с минимальной подготовкой оснований.",
    suitableFor: [
      "Квартиры и помещения в удовлетворительном состоянии",
      "Объекты перед продажей или сдачей в аренду",
      "Помещения, где требуется обновление отделки без замены инженерии",
    ],
    benefits: [
      "Самый быстрый цикл работ",
      "Минимальное воздействие на инженерные системы",
      "Зафиксированная стоимость работ",
      "Поэтапная приёмка по актам",
    ],
    technology: [
      "Удаление слабодержащихся покрытий",
      "Локальная шпаклёвка трещин и неровностей",
      "Грунтование оснований перед финишной отделкой",
      "Окраска стен и потолков либо поклейка обоев",
    ],
    related: ["remont-pod-klyuch", "ekonom-remont", "chistovaya-otdelka"],
    estimateExampleItemIds: [
      "finishing_walls-gruntovanie",
      "finishing_walls-shpaklevka-oboi",
      "finishing_walls-pokraska",
      "finishing_walls-oboi",
      "finishing_floors-laminat",
      "finishing_floors-plintus",
    ],
    estimateExampleVolumes: v([
      ["finishing_walls-gruntovanie", 180],
      ["finishing_walls-shpaklevka-oboi", 180],
      ["finishing_walls-pokraska", 180],
      ["finishing_walls-oboi", 180],
      ["finishing_floors-laminat", 60],
      ["finishing_floors-plintus", 50],
    ]),
    estimateExampleNotes: {
      "finishing_walls-pokraska": "Вариант отделки: покраска или обои",
      "finishing_walls-oboi": "Вариант отделки: покраска или обои",
    },
  }),

  // 4) /ekonom-remont
  packageBased({
    slug: "ekonom-remont",
    packageId: "econom",
    title: "Эконом-ремонт",
    h1: "Эконом-ремонт квартиры или помещения",
    metaTitle: "Эконом-ремонт — от 12 000 ₽/м² | Шадов и партнёры",
    metaDescription:
      "Эконом-ремонт квартир и помещений с базовой заменой отделки, выравниванием стен и заменой сантехнических приборов в существующих точках.",
    description:
      "Базовая комплектация ремонта: подготовка стен под обои или окраску, стяжка пола до 50 мм, замена розеток и сантехнических приборов в существующих точках.",
    suitableFor: [
      "Квартиры со средним уровнем износа отделки",
      "Помещения, где не требуется полная замена инженерии",
      "Объекты с ограниченным бюджетом и стандартной планировкой",
    ],
    benefits: [
      "Базовая комплектация с зафиксированной стоимостью работ",
      "Стандартные сроки выполнения",
      "Поэтапная оплата",
      "Контроль скрытых работ по актам",
    ],
    technology: [
      "Демонтаж старых покрытий и плинтусов",
      "Базовое выравнивание стен под обои или покраску",
      "Цементно-песчаная стяжка пола толщиной до 50 мм",
      "Финишная отделка по выбранному пакету",
    ],
    related: ["kosmeticheskiy-remont", "standartnyy-remont", "remont-pod-klyuch"],
    estimateExampleItemIds: [
      "demolition-plitka",
      "finishing_walls-shpaklevka-oboi",
      "finishing_walls-oboi",
      "finishing_floors-laminat",
      "tiling-standart-keram",
      "finishing_doors-standart",
    ],
    estimateExampleVolumes: v([
      ["demolition-plitka", 20],
      ["finishing_walls-shpaklevka-oboi", 180],
      ["finishing_walls-oboi", 180],
      ["finishing_floors-laminat", 60],
      ["tiling-standart-keram", 20],
      ["finishing_doors-standart", 4],
    ]),
  }),

  // 5) /standartnyy-remont
  packageBased({
    slug: "standartnyy-remont",
    packageId: "standard",
    title: "Стандартный ремонт",
    h1: "Стандартный ремонт квартиры или дома",
    metaTitle: "Стандартный ремонт — от 18 000 ₽/м² | Шадов и партнёры",
    metaDescription:
      "Стандартный ремонт квартир и домов с полной заменой электропроводки, труб водоснабжения и отопления, выравниванием стен по маякам.",
    description:
      "Полноценный ремонт без сложных дизайнерских решений: полная замена электропроводки и труб, выравнивание стен по маякам, стандартные потолки и финишная отделка.",
    suitableFor: [
      "Квартиры в новостройках и вторичном жилье",
      "Частные дома без сложной перепланировки",
      "Объекты с типовой планировкой и стандартной геометрией",
    ],
    benefits: [
      "Полная замена инженерных систем в пределах квартиры",
      "Выравнивание стен по маякам",
      "Стандартные потолки и финишная отделка",
      "Поэтапная приёмка по актам",
    ],
    technology: [
      "Демонтаж и вывоз строительного мусора",
      "Полная замена электропроводки",
      "Замена труб водоснабжения и канализации в пределах квартиры",
      "Выравнивание стен по маякам",
      "Цементно-песчаная или полусухая стяжка пола",
      "Финишная отделка по выбранному пакету",
    ],
    related: ["ekonom-remont", "evroremont", "remont-pod-klyuch"],
    estimateExampleItemIds: [
      "demolition-kompleksnyy",
      "finishing_walls-shtukaturka-mayaki",
      "finishing_floors-polusukhaya",
      "electrical-chernovaya-tochka",
      "plumbing-kompleksnaya-tochka",
      "tiling-keramogranit-600",
    ],
    estimateExampleVolumes: v([
      ["demolition-kompleksnyy", 60],
      ["finishing_walls-shtukaturka-mayaki", 180],
      ["finishing_floors-polusukhaya", 60],
      ["electrical-chernovaya-tochka", 40],
      ["plumbing-kompleksnaya-tochka", 8],
      ["tiling-keramogranit-600", 25],
    ]),
  }),

  // 6) /evroremont
  packageBased({
    slug: "evroremont",
    packageId: "euro",
    title: "Евроремонт",
    h1: "Евроремонт квартиры или дома уровня комфорт",
    metaTitle: "Евроремонт — от 25 000 ₽/м² | Шадов и партнёры",
    metaDescription:
      "Евроремонт квартир и домов с расширенным комплектом инженерных систем, коллекторной разводкой водоснабжения, многоуровневыми потолками.",
    description:
      "Современный уровень отделки с расширенным комплектом инженерных систем: коллекторная разводка, многоуровневые потолки, базовая шумоизоляция.",
    suitableFor: [
      "Квартиры и дома комфорт-класса",
      "Объекты с современной планировкой и инженерными требованиями",
      "Помещения, где требуется расширенный комплект отделочных решений",
    ],
    benefits: [
      "Расширенный комплект инженерных систем",
      "Многоуровневые потолки и базовая шумоизоляция",
      "Поэтапная оплата по принятым этапам",
      "Ежедневная отчётность по объекту",
    ],
    technology: [
      "Полный демонтаж до основания",
      "Полная замена электропроводки с проектным щитом",
      "Коллекторная разводка водоснабжения",
      "Полусухая или мокрая стяжка пола",
      "Выравнивание стен под окраску по уровню",
      "Многоуровневые потолки и финишная отделка",
    ],
    related: ["standartnyy-remont", "biznes-remont", "remont-pod-klyuch"],
    estimateExampleItemIds: [
      "finishing_walls-shpaklevka-pokraska",
      "finishing_walls-proyavochnyy-svet",
      "finishing_ceilings-skrytyy-karniz",
      "electrical-svetodiodnaya-lenta",
      "tiling-krupnoformat",
      "plumbing-zashchita-protechek",
    ],
    estimateExampleVolumes: v([
      ["finishing_walls-shpaklevka-pokraska", 180],
      ["finishing_walls-proyavochnyy-svet", 60],
      ["finishing_ceilings-skrytyy-karniz", 30],
      ["electrical-svetodiodnaya-lenta", 30],
      ["tiling-krupnoformat", 25],
      ["plumbing-zashchita-protechek", 1],
    ]),
  }),

  // 7) /biznes-remont
  packageBased({
    slug: "biznes-remont",
    packageId: "business",
    title: "Бизнес-ремонт",
    h1: "Ремонт квартиры или дома бизнес-класса",
    metaTitle: "Бизнес-ремонт — от 35 000 ₽/м² | Шадов и партнёры",
    metaDescription:
      "Бизнес-ремонт квартир и домов с проектным электрическим щитом, коллекторной разводкой водоснабжения, тёплым полом и шумоизоляцией.",
    description:
      "Повышенный уровень отделки, проектный электрический щит, коллекторная разводка водоснабжения, тёплый пол в проектных зонах, шумоизоляция стен и потолков.",
    suitableFor: [
      "Квартиры и дома бизнес-класса",
      "Объекты с проектной перепланировкой",
      "Помещения, требующие повышенного уровня инженерии",
    ],
    benefits: [
      "Проектный электрический щит с УЗО и реле напряжения",
      "Коллекторная разводка водоснабжения",
      "Тёплый пол в проектных зонах",
      "Шумоизоляция стен, потолков и пола",
      "Поэтапная приёмка по актам",
    ],
    technology: [
      "Демонтаж до основания, усиление и подготовка проёмов",
      "Перепланировка и возведение перегородок по согласованному проекту",
      "Электромонтаж с проектным щитом, УЗО и слаботочкой",
      "Коллекторная разводка водоснабжения с приборами учёта",
      "Тёплый пол в зонах по проекту",
      "Многоуровневые потолки и декоративная отделка",
    ],
    related: ["evroremont", "premialnyy-remont", "remont-pod-klyuch"],
    estimateExampleItemIds: [
      "finishing_walls-proyavochnyy-svet",
      "finishing_ceilings-tenevoe",
      "finishing_ceilings-skrytyy-karniz",
      "finishing_floors-inzhenernaya",
      "tiling-krupnoformat",
      "finishing_doors-skrytyy-montazh",
    ],
    estimateExampleVolumes: v([
      ["finishing_walls-proyavochnyy-svet", 120],
      ["finishing_ceilings-tenevoe", 30],
      ["finishing_ceilings-skrytyy-karniz", 30],
      ["finishing_floors-inzhenernaya", 60],
      ["tiling-krupnoformat", 25],
      ["finishing_doors-skrytyy-montazh", 4],
    ]),
  }),

  // 8) /premialnyy-remont
  packageBased({
    slug: "premialnyy-remont",
    packageId: "premium",
    title: "Премиальный ремонт",
    h1: "Премиальный ремонт квартиры или частного дома",
    metaTitle: "Премиальный ремонт — от 48 000 ₽/м² | Шадов и партнёры",
    metaDescription:
      "Премиальный ремонт квартир и домов с авторским дизайн-проектом, мультизональным кондиционированием, базовой интеграцией умного дома.",
    description:
      "Премиальный уровень отделки и инженерных систем: проектный электрический щит, водоподготовка, мультизональное кондиционирование, базовая интеграция умного дома.",
    suitableFor: [
      "Премиальные квартиры и дома",
      "Объекты с авторским дизайн-проектом",
      "Помещения с расширенными инженерными требованиями",
    ],
    benefits: [
      "Проектный электрический щит с контурами защиты",
      "Коллекторная разводка с системой водоподготовки",
      "Мультизональное кондиционирование и приточная вентиляция",
      "Многоуровневые потолки с проектной подсветкой",
      "Базовая интеграция умного дома",
    ],
    technology: [
      "Демонтаж до основания и инженерное усиление по проекту",
      "Перепланировка по согласованному дизайн-проекту",
      "Электромонтаж по индивидуальному проекту",
      "Коллекторная разводка водоснабжения с водоподготовкой",
      "Полусухая или мокрая стяжка с разделительными слоями",
      "Многоуровневые потолки с проектной подсветкой и нишами",
      "Эксклюзивные финишные материалы и скрытые двери",
    ],
    related: ["biznes-remont", "remont-pod-klyuch", "evroremont"],
    estimateExampleItemIds: [
      "finishing_walls-mikrocement",
      "finishing_walls-proyavochnyy-svet",
      "finishing_ceilings-tenevoe",
      "finishing_floors-skrytyy-plintus",
      "tiling-plity-3200",
      "finishing_doors-skrytyy-montazh",
    ],
    estimateExampleVolumes: v([
      ["finishing_walls-mikrocement", 30],
      ["finishing_walls-proyavochnyy-svet", 120],
      ["finishing_ceilings-tenevoe", 40],
      ["finishing_floors-skrytyy-plintus", 50],
      ["tiling-plity-3200", 20],
      ["finishing_doors-skrytyy-montazh", 4],
    ]),
  }),

  // 9) /chernovoy-remont
  {
    slug: "chernovoy-remont",
    route: "/chernovoy-remont",
    category: "repair",
    title: "Черновой ремонт",
    metaTitle: "Черновой ремонт квартир и домов — Шадов и партнёры",
    metaDescription:
      "Черновой этап ремонта: подготовка стен, полов, потолков и инженерных систем под последующую чистовую отделку. Контроль скрытых работ по актам.",
    h1: "Черновой ремонт квартиры или частного дома",
    description:
      "Подготовка помещения под чистовую отделку: демонтаж, выравнивание стен и потолков, стяжка пола, замена инженерных систем, приёмка скрытых работ по актам.",
    // Источник: additional_repairs.chernovoy-kvartiry = 10 000 ₽/м² пола.
    startingPrice: additionalStartingPrice(10000, "м² пола"),
    suitableFor: [
      "Новые квартиры без отделки",
      "Помещения после демонтажа",
      "Объекты, где чистовая отделка планируется отдельно",
    ],
    benefits: [
      "Подготовка под любую чистовую отделку",
      "Замена инженерных систем по выбранной схеме",
      "Контроль скрытых работ по актам с фотофиксацией",
      "Поэтапная приёмка",
    ],
    included: [
      "Демонтажные работы и вывоз строительного мусора",
      "Возведение и перенос перегородок по проекту",
      "Полная замена электропроводки с подрозетниками",
      "Замена труб водоснабжения и канализации",
      "Установка радиаторов и подводок отопления",
      "Выравнивание стен по маякам",
      "Цементно-песчаная или полусухая стяжка пола",
      "Подготовка оснований под финишную отделку",
      "Опрессовка инженерных систем",
    ],
    excluded: [
      "Финишная окраска стен и потолков",
      "Поклейка обоев",
      "Укладка ламината и паркетной доски",
      "Установка межкомнатных дверей",
      "Монтаж сантехнических приборов",
      "Стоимость материалов",
    ],
    technology: [
      "Демонтаж по технологической карте",
      "Электромонтаж по правилам устройства электроустановок",
      "Сантехнические системы с опрессовкой",
      "Выравнивание оснований инструментальными средствами",
    ],
    stages: SHARED_STAGES,
    qualityControl: SHARED_QUALITY,
    documents: SHARED_DOCS,
    timelineFactors: SHARED_TIMELINE,
    priceCategoryIds: ["additional_repairs", "demolition"],
    faqIds: [
      "contract-price",
      "payment-stages",
      "hidden-works",
      "additional-works",
      "documents-handover",
    ],
    relatedSlugs: [
      "chistovaya-otdelka",
      "remont-pod-klyuch",
      "elektromontazh",
      "santehnika",
    ],
    estimateExampleItemIds: [
      "demolition-kompleksnyy",
      "finishing_walls-peregorodka-gkl",
      "finishing_walls-shtukaturka-mayaki",
      "finishing_floors-polusukhaya",
      "electrical-chernovaya-tochka",
      "plumbing-kompleksnaya-tochka",
    ],
    estimateExampleVolumes: v([
      ["demolition-kompleksnyy", 60],
      ["finishing_walls-peregorodka-gkl", 30],
      ["finishing_walls-shtukaturka-mayaki", 180],
      ["finishing_floors-polusukhaya", 60],
      ["electrical-chernovaya-tochka", 40],
      ["plumbing-kompleksnaya-tochka", 8],
    ]),
  },

  // 10) /chistovaya-otdelka
  {
    slug: "chistovaya-otdelka",
    route: "/chistovaya-otdelka",
    category: "repair",
    title: "Чистовая отделка",
    metaTitle: "Чистовая отделка стен, полов и потолков — Шадов и партнёры",
    metaDescription:
      "Чистовая отделка: окраска и обои, плитка и керамогранит, ламинат и паркетная доска, потолки и установка дверей. Поэтапная приёмка по актам.",
    h1: "Чистовая отделка квартиры или частного дома",
    description:
      "Финишные работы и установка отделочных элементов на подготовленные основания. Окраска и обои, плитка и керамогранит, потолки, ламинат и паркетная доска, установка дверей.",
    // Источник: additional_repairs.chistovaya-otdelka = 8 000 ₽/м² пола.
    startingPrice: additionalStartingPrice(8000, "м² пола"),
    suitableFor: [
      "Помещения после чернового ремонта",
      "Объекты с подготовленными основаниями",
      "Квартиры и дома, где требуется только финишная отделка",
    ],
    benefits: [
      "Финишная отделка любого уровня сложности",
      "Подбор технологии под выбранные материалы",
      "Поэтапная приёмка по актам",
      "Стоимость работ зафиксирована в смете",
    ],
    included: [
      "Подготовка оснований под финишное покрытие",
      "Окраска стен и потолков",
      "Поклейка обоев под покраску или с готовым рисунком",
      "Укладка плитки и керамогранита",
      "Укладка ламината или паркетной доски",
      "Монтаж натяжных и подвесных потолков",
      "Установка межкомнатных дверей и наличников",
      "Установка плинтусов, розеток, выключателей",
    ],
    excluded: [
      "Демонтажные работы",
      "Замена электропроводки и сантехнических труб",
      "Стяжка пола и выравнивание стен по маякам",
      "Перепланировка и возведение перегородок",
      "Стоимость отделочных материалов",
    ],
    technology: [
      "Контроль готовности оснований под финишное покрытие",
      "Финишная шпаклёвка с грунтованием",
      "Финишная окраска или поклейка обоев",
      "Укладка плитки с контролем геометрии",
      "Монтаж потолков и дверей по технологическим картам",
    ],
    stages: SHARED_STAGES,
    qualityControl: SHARED_QUALITY,
    documents: SHARED_DOCS,
    timelineFactors: SHARED_TIMELINE,
    priceCategoryIds: [
      "finishing_walls",
      "finishing_floors",
      "finishing_ceilings",
      "finishing_doors",
    ],
    faqIds: [
      "contract-price",
      "payment-stages",
      "materials-procurement",
      "additional-works",
      "documents-handover",
    ],
    relatedSlugs: [
      "chernovoy-remont",
      "remont-pod-klyuch",
      "ukladka-plitki",
    ],
    estimateExampleItemIds: [
      "finishing_walls-pokraska",
      "finishing_walls-oboi",
      "finishing_floors-laminat",
      "tiling-standart-keram",
      "finishing_floors-plintus",
      "finishing_doors-standart",
    ],
    estimateExampleVolumes: v([
      ["finishing_walls-pokraska", 180],
      ["finishing_walls-oboi", 180],
      ["finishing_floors-laminat", 60],
      ["tiling-standart-keram", 20],
      ["finishing_floors-plintus", 50],
      ["finishing_doors-standart", 4],
    ]),
    estimateExampleNotes: {
      "finishing_walls-oboi": "Альтернативный вариант: поклейка обоев вместо покраски",
      "finishing_floors-laminat": "Альтернатива: укладка кварцвинила",
    },
  },
  // 11) /ukladka-plitki — отдельная отделочная страница (категория repair).
  // Подэтап 2.6: страница активирована, RouteStub снят, noindex удалён.
  // Стартовая цена берётся из tiling-standart-keram (prices.ts).
  {
    slug: "ukladka-plitki",
    route: "/ukladka-plitki",
    category: "repair",
    title: "Укладка плитки",
    metaTitle: "Укладка плитки и керамогранита — Шадов и партнёры",
    metaDescription:
      "Укладка керамической плитки, керамогранита, мозаики и крупноформатных плит. Подготовка основания, гидроизоляция, разметка, затирка. От 2 800 ₽/м² за работы.",
    h1: "Укладка плитки и керамогранита",
    description:
      "Укладка керамической плитки, керамогранита, мозаики и крупноформатных материалов на стены и полы. Подготовка основания, гидроизоляция мокрых зон, разметка раскладки, подрезка, затирка и герметизация примыканий.",
    startingPrice: "от\u00A02\u00A0800\u00A0₽/м² за работы",
    startingPriceItemId: "tiling-standart-keram",
    suitableFor: [
      "Ванные комнаты и санузлы",
      "Кухни и кухонные фартуки",
      "Прихожие и коридоры",
      "Гостиные и кабинеты с плиточным или керамогранитным полом",
      "Лестницы, ступени и террасы",
      "Коммерческие помещения с повышенной нагрузкой",
    ],
    benefits: [
      "Подготовка основания под фактический формат и тип материала",
      "Гидроизоляция в мокрых зонах по технологии производителя",
      "Согласование раскладки до начала укладки",
      "Контроль геометрии, плоскости и ширины швов",
      "Эпоксидная или цементная затирка по выбору заказчика",
      "Поэтапная приёмка по актам",
    ],
    included: [
      "Изучение основания и параметров материала",
      "Контроль геометрии помещения",
      "Подготовка и при необходимости выравнивание основания",
      "Гидроизоляция мокрых зон, если предусмотрена",
      "Грунтование основания",
      "Разметка и согласование раскладки",
      "Подготовка клеевого состава по инструкции производителя",
      "Укладка плитки или керамогранита выбранного формата",
      "Подрезка и оформление наружных углов и узлов",
      "Изготовление отверстий под инженерные элементы",
      "Затирка швов цементной или эпоксидной затиркой",
      "Герметизация примыканий в мокрых зонах",
      "Контроль плоскости, швов и заполнения клеем",
      "Очистка поверхности и сдача участка",
    ],
    excluded: [
      "Стоимость плитки, керамогранита, клея, затирки и герметика",
      "Стяжка пола и капитальное выравнивание основания по маякам",
      "Демонтаж старой плитки и вывоз строительного мусора",
      "Электромонтажные и сантехнические работы",
      "Установка экранов, поддонов и сантехнических приборов",
      "Дизайн-проект и подбор материалов",
    ],
    technology: [
      "Подбор клеевого состава под тип и формат материала",
      "Гидроизоляция мокрых зон по технологии производителя",
      "Контроль плоскости основания правилом и уровнем",
      "Разметка раскладки от видовой стены или центра помещения",
      "Затирка после полного набора прочности клеевого состава",
    ],
    stages: [
      "Изучение основания и параметров материала",
      "Проверка геометрии помещения",
      "Подготовка основания",
      "Гидроизоляция мокрых зон, если предусмотрена",
      "Разметка и согласование раскладки",
      "Подготовка клеевого состава",
      "Укладка плитки или керамогранита",
      "Подрезка и оформление узлов",
      "Затирка швов",
      "Герметизация примыканий",
      "Очистка поверхности",
      "Приёмка участка",
    ],
    qualityControl: [
      "Контроль состояния и влажности основания",
      "Контроль геометрии и плоскости поверхности",
      "Соответствие раскладки согласованной схеме",
      "Контроль ширины швов и заполнения клеем",
      "Контроль наружных углов и узлов примыканий",
      "Контроль уклонов в мокрых зонах, если предусмотрены",
      "Контроль качества затирки и герметизации",
      "Контроль отсутствия повреждений плитки",
    ],
    documents: SHARED_DOCS,
    timelineFactors: SHARED_TIMELINE,
    priceCategoryIds: ["tiling"],
    faqIds: [
      "calc-without-visit",
      "contract-price",
      "payment-stages",
      "materials-procurement",
      "additional-works",
      "hidden-works",
    ],
    relatedSlugs: [
      "chistovaya-otdelka",
      "remont-pod-klyuch",
      "santehnika",
      "teplyy-pol",
    ],
    estimateExampleItemIds: [
      "tiling-vyravnivanie",
      "tiling-gidroizolyatsiya",
      "tiling-standart-keram",
      "tiling-zapil-45",
      "tiling-cement-zatirka",
      "tiling-plintus",
    ],
    estimateExampleVolumes: v([
      ["tiling-vyravnivanie", 25],
      ["tiling-gidroizolyatsiya", 12],
      ["tiling-standart-keram", 25],
      ["tiling-zapil-45", 8],
      ["tiling-cement-zatirka", 25],
      ["tiling-plintus", 10],
    ]),
    estimateExampleNotes: {
      "tiling-standart-keram":
        "Окончательная разбивка зависит от основания, формата материала, раскладки и состава работ.",
    },
  },
];
