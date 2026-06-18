/**
 * Подэтап 2.1A — единый источник утверждённых цен (334 позиции, 24 категории).
 *
 * Правила:
 * - Все значения — числа, без пробелов и символа ₽. Форматирование через src/lib/format-price.ts.
 * - actualDate всех позиций — "2026-06".
 * - ID уникальны и стабильны. Менять ID нельзя — на них ссылаются страницы.
 * - materialsIncluded=true ТОЛЬКО для категории house_construction_materials.
 * - unitLabel задаётся только когда основание расчёта требует уточнения (м² пола, м³ бетона и т.п.).
 */

import type { PriceItem, PriceCategory, PriceUnit, PriceMode } from "@/types/pricing";

type O = {
  unit?: PriceUnit;
  unitLabel?: string;
  from?: number;
  to?: number;
  pctFrom?: number;
  pctTo?: number;
  label?: string;
  slug?: string;
  note?: string;
  mode?: PriceMode;
  materialsIncluded?: boolean;
  sort: number;
};

const make = (category: PriceCategory, id: string, name: string, o: O): PriceItem => {
  const p: PriceItem = {
    id: `${category}-${id}`,
    category,
    name,
    mode: o.mode ?? "work",
    materialsIncluded: o.materialsIncluded ?? false,
    actualDate: "2026-06",
    sortOrder: o.sort,
  };
  if (o.unit !== undefined) p.unit = o.unit;
  if (o.unitLabel !== undefined) p.unitLabel = o.unitLabel;
  if (o.from !== undefined) p.priceFrom = o.from;
  if (o.to !== undefined) p.priceTo = o.to;
  if (o.pctFrom !== undefined) p.percentageFrom = o.pctFrom;
  if (o.pctTo !== undefined) p.percentageTo = o.pctTo;
  if (o.label !== undefined) p.priceLabel = o.label;
  if (o.slug !== undefined) p.serviceSlug = o.slug;
  if (o.note !== undefined) p.note = o.note;
  return p;
};

// ── 1. ПАКЕТЫ КОМПЛЕКСНОГО РЕМОНТА (7) ───────────────────────────────────
const REPAIR_PACKAGES: PriceItem[] = [
  make("repair_packages", "cosmetic",  "Косметический ремонт",    { unit: "м²", from: 6500,  slug: "kosmeticheskiy-remont", sort: 1 }),
  make("repair_packages", "econom",    "Эконом-ремонт",           { unit: "м²", from: 12000, slug: "ekonom-remont",        sort: 2 }),
  make("repair_packages", "standard",  "Стандартный ремонт",      { unit: "м²", from: 18000, slug: "standartnyy-remont",   sort: 3 }),
  make("repair_packages", "euro",      "Евроремонт / комфорт",    { unit: "м²", from: 25000, slug: "evroremont",           sort: 4 }),
  make("repair_packages", "business",  "Бизнес-ремонт",           { unit: "м²", from: 35000, slug: "biznes-remont",        sort: 5 }),
  make("repair_packages", "premium",   "Премиальный ремонт",      { unit: "м²", from: 48000, slug: "premialnyy-remont",    sort: 6 }),
  make("repair_packages", "exclusive", "Эксклюзивный ремонт",     { unit: "м²", from: 65000, slug: "remont-pod-klyuch",    sort: 7, note: "Размещается как пакет на /remont-pod-klyuch и /prices" }),
];

// ── 2. ДОПОЛНИТЕЛЬНЫЕ ВАРИАНТЫ РЕМОНТА (11) ───────────────────────────────
const ADDITIONAL_REPAIRS: PriceItem[] = [
  make("additional_repairs", "chernovoy-kvartiry",     "Черновой ремонт квартиры",                { unit: "м²", unitLabel: "м² пола", from: 10000, slug: "chernovoy-remont",   sort: 1 }),
  make("additional_repairs", "white-box",              "Подготовка White Box",                    { unit: "м²", unitLabel: "м² пола", from: 13000, sort: 2 }),
  make("additional_repairs", "chistovaya-otdelka",     "Чистовая отделка",                        { unit: "м²", unitLabel: "м² пола", from: 8000,  slug: "chistovaya-otdelka", sort: 3 }),
  make("additional_repairs", "novostroyka",            "Ремонт квартиры в новостройке",           { unit: "м²", unitLabel: "м² пола", from: 16000, sort: 4 }),
  make("additional_repairs", "kapremont-vtorichka",    "Капитальный ремонт вторичного жилья",     { unit: "м²", unitLabel: "м² пола", from: 20000, sort: 5 }),
  make("additional_repairs", "chastnyy-dom",           "Ремонт частного дома",                    { unit: "м²", unitLabel: "м² пола", from: 22000, sort: 6 }),
  make("additional_repairs", "apartamenty",            "Ремонт апартаментов",                     { unit: "м²", unitLabel: "м² пола", from: 20000, sort: 7 }),
  make("additional_repairs", "office",                 "Ремонт офиса",                            { unit: "м²", unitLabel: "м² пола", from: 12000, sort: 8 }),
  make("additional_repairs", "commercial",             "Ремонт коммерческого помещения",          { unit: "м²", unitLabel: "м² пола", from: 15000, sort: 9 }),
  make("additional_repairs", "sanuzel-rabota",         "Ремонт санузла, только работа",           { unit: "комплект", from: 180000, sort: 10 }),
  make("additional_repairs", "vannaya-tualet-razdel",  "Ремонт ванной и туалета раздельно",       { unit: "комплект", from: 260000, sort: 11 }),
];

// ── 3. СТРОИТЕЛЬСТВО ДОМОВ — ТОЛЬКО РАБОТЫ (36) ──────────────────────────
type HouseRow = { slug: string; name: string; shell: number; warmShell: number; preFinish: number; turnkey: number; turnkeyMaterials: number; sort: number };
const HOUSE_ROWS: HouseRow[] = [
  { slug: "karkasnye-doma",               name: "Каркасный дом",                 shell: 18000, warmShell: 26000, preFinish: 36000, turnkey: 45000, turnkeyMaterials: 95000,  sort: 1 },
  { slug: "doma-iz-sip-paneley",          name: "Дом из СИП-панелей",            shell: 17000, warmShell: 25000, preFinish: 35000, turnkey: 44000, turnkeyMaterials: 90000,  sort: 2 },
  { slug: "doma-iz-brusa",                name: "Дом из профилированного бруса", shell: 20000, warmShell: 28000, preFinish: 38000, turnkey: 48000, turnkeyMaterials: 105000, sort: 3 },
  { slug: "doma-iz-kleenogo-brusa",       name: "Дом из клееного бруса",         shell: 24000, warmShell: 34000, preFinish: 46000, turnkey: 58000, turnkeyMaterials: 125000, sort: 4 },
  { slug: "doma-iz-gazobetona",           name: "Дом из газобетона",             shell: 25000, warmShell: 36000, preFinish: 50000, turnkey: 65000, turnkeyMaterials: 125000, sort: 5 },
  { slug: "doma-iz-keramicheskih-blokov", name: "Дом из керамических блоков",    shell: 28000, warmShell: 40000, preFinish: 55000, turnkey: 72000, turnkeyMaterials: 145000, sort: 6 },
  { slug: "kirpichnye-doma",              name: "Кирпичный дом",                 shell: 32000, warmShell: 45000, preFinish: 62000, turnkey: 80000, turnkeyMaterials: 165000, sort: 7 },
  { slug: "monolitnye-doma",              name: "Монолитный дом",                shell: 35000, warmShell: 50000, preFinish: 70000, turnkey: 90000, turnkeyMaterials: 180000, sort: 8 },
  { slug: "kombinirovannye-doma",         name: "Комбинированный дом",           shell: 40000, warmShell: 55000, preFinish: 75000, turnkey: 95000, turnkeyMaterials: 190000, sort: 9 },
];

const HOUSE_WORK: PriceItem[] = HOUSE_ROWS.flatMap((r) => [
  make("house_construction_work", `${r.slug}-shell`,     `${r.name} — коробка`,                { unit: "м²", unitLabel: "м² площади дома", from: r.shell,     slug: r.slug, sort: r.sort * 10 + 1 }),
  make("house_construction_work", `${r.slug}-warm`,      `${r.name} — тёплый контур`,          { unit: "м²", unitLabel: "м² площади дома", from: r.warmShell, slug: r.slug, sort: r.sort * 10 + 2 }),
  make("house_construction_work", `${r.slug}-prefinish`, `${r.name} — под чистовую отделку`,   { unit: "м²", unitLabel: "м² площади дома", from: r.preFinish, slug: r.slug, sort: r.sort * 10 + 3 }),
  make("house_construction_work", `${r.slug}-turnkey`,   `${r.name} — под ключ`,               { unit: "м²", unitLabel: "м² площади дома", from: r.turnkey,   slug: r.slug, sort: r.sort * 10 + 4 }),
]);

// ── 4. СТРОИТЕЛЬСТВО ДОМОВ — РАБОТЫ + БАЗОВЫЕ МАТЕРИАЛЫ (9) ──────────────
const HOUSE_MATERIALS: PriceItem[] = HOUSE_ROWS.map((r) =>
  make("house_construction_materials", `${r.slug}-turnkey-materials`, `${r.name} — под ключ с базовыми материалами`,
    { unit: "м²", unitLabel: "м² площади дома", from: r.turnkeyMaterials, slug: r.slug, mode: "work_and_basic_materials", materialsIncluded: true, sort: r.sort })
);

// ── 5. МОНОЛИТНЫЕ РАБОТЫ (20) ─────────────────────────────────────────────
const MONOLITHIC: PriceItem[] = [
  make("monolithic", "betonnaya-podgotovka",       "Бетонная подготовка",                                      { unit: "м³", from: 8000,  slug: "monolitnye-raboty", sort: 1 }),
  make("monolithic", "fundament-plita",            "Монолитная фундаментная плита с армированием и опалубкой", { unit: "м³", from: 18000, slug: "monolitnye-raboty", sort: 2 }),
  make("monolithic", "lentochnyy-fundament",       "Ленточный монолитный фундамент",                           { unit: "м³", from: 17000, slug: "monolitnye-raboty", sort: 3 }),
  make("monolithic", "rostverk",                   "Монолитный ростверк",                                      { unit: "м³", from: 18000, slug: "monolitnye-raboty", sort: 4 }),
  make("monolithic", "steny-podvala",              "Монолитные стены подвала",                                 { unit: "м³", from: 20000, slug: "monolitnye-raboty", sort: 5 }),
  make("monolithic", "steny-zdaniya",              "Монолитные стены здания",                                  { unit: "м³", from: 22000, slug: "monolitnye-raboty", sort: 6 }),
  make("monolithic", "kolonny",                    "Железобетонные колонны",                                   { unit: "м³", from: 30000, slug: "monolitnye-raboty", sort: 7 }),
  make("monolithic", "pilony",                     "Пилоны",                                                   { unit: "м³", from: 28000, slug: "monolitnye-raboty", sort: 8 }),
  make("monolithic", "perekrytie",                 "Монолитное перекрытие",                                    { unit: "м³", from: 20000, slug: "monolitnye-raboty", sort: 9 }),
  make("monolithic", "lestnitsa",                  "Монолитная лестница",                                      { unit: "м³", from: 35000, slug: "monolitnye-raboty", sort: 10 }),
  make("monolithic", "armopoyas",                  "Монолитный армопояс",                                      { unit: "м³", from: 22000, slug: "monolitnye-raboty", sort: 11 }),
  make("monolithic", "podpornye-steny",            "Подпорные стены",                                          { unit: "м³", from: 22000, slug: "monolitnye-raboty", sort: 12 }),
  make("monolithic", "armatura",                   "Установка и вязка арматуры",                               { unit: "тонна", from: 30000, slug: "monolitnye-raboty", sort: 13 }),
  make("monolithic", "opalubka-montazh",           "Монтаж опалубки отдельно",                                 { unit: "м²", unitLabel: "м² поверхности", from: 1600, slug: "monolitnye-raboty", sort: 14 }),
  make("monolithic", "opalubka-demontazh",         "Демонтаж опалубки",                                        { unit: "м²", unitLabel: "м² поверхности", from: 500,  slug: "monolitnye-raboty", sort: 15 }),
  make("monolithic", "priem-betona",               "Приём бетона с вибрированием",                             { unit: "м³", from: 2500,  slug: "monolitnye-raboty", sort: 16 }),
  make("monolithic", "uhod-za-betonom",            "Уход за бетоном",                                          { unit: "м²", from: 250,   slug: "monolitnye-raboty", sort: 17 }),
  make("monolithic", "almaznoe-sverlenie",         "Алмазное сверление",                                       { unit: "отверстие", from: 1500, slug: "monolitnye-raboty", sort: 18 }),
  make("monolithic", "plity-perekrytia-montazh",   "Монтаж плит перекрытия",                                   { unit: "м²", from: 2000, slug: "monolitnye-raboty", sort: 19 }),
  make("monolithic", "zhb-peremychka",             "Монтаж железобетонной перемычки",                          { unit: "шт.", from: 2500, slug: "monolitnye-raboty", sort: 20 }),
];

// ── 6. ФУНДАМЕНТЫ (20) ────────────────────────────────────────────────────
const FOUNDATIONS: PriceItem[] = [
  make("foundations", "razrabotka-ekskavator", "Разработка грунта экскаватором",         { unit: "м³", from: 600,  slug: "fundamenty", sort: 1 }),
  make("foundations", "razrabotka-vruchnuyu",  "Разработка грунта вручную",              { unit: "м³", from: 2500, slug: "fundamenty", sort: 2 }),
  make("foundations", "planirovka",            "Планировка основания",                   { unit: "м²", from: 350,  slug: "fundamenty", sort: 3 }),
  make("foundations", "pesok",                 "Песчаная подготовка с уплотнением",      { unit: "м²", from: 700,  slug: "fundamenty", sort: 4 }),
  make("foundations", "scheben",               "Щебёночная подготовка с уплотнением",    { unit: "м²", from: 750,  slug: "fundamenty", sort: 5 }),
  make("foundations", "geotekstil",            "Устройство геотекстиля",                 { unit: "м²", from: 150,  slug: "fundamenty", sort: 6 }),
  make("foundations", "betonnaya-podgotovka",  "Бетонная подготовка",                    { unit: "м³", from: 8000, slug: "fundamenty", sort: 7 }),
  make("foundations", "plita",                 "Фундаментная плита",                     { unit: "м³", unitLabel: "м³ бетона",     from: 18000, slug: "fundamenty", sort: 8 }),
  make("foundations", "lentochnyy",            "Ленточный фундамент",                    { unit: "м³", unitLabel: "м³ бетона",     from: 17000, slug: "fundamenty", sort: 9 }),
  make("foundations", "rostverk",              "Ростверк",                               { unit: "м³", unitLabel: "м³ бетона",     from: 18000, slug: "fundamenty", sort: 10 }),
  make("foundations", "ushp",                  "Утеплённая шведская плита",              { unit: "м²", unitLabel: "м² плиты",       from: 18000, slug: "fundamenty", sort: 11 }),
  make("foundations", "svayno-rostverk",       "Свайно-ростверковый фундамент",          { unit: "м²", unitLabel: "м² площади дома", from: 15000, slug: "fundamenty", sort: 12 }),
  make("foundations", "buronabivnaya",         "Буронабивная свая до 300 мм",            { unit: "шт.", from: 7000, slug: "fundamenty", sort: 13 }),
  make("foundations", "obmazochnaya-gidro",    "Обмазочная гидроизоляция",               { unit: "м²", from: 1300, slug: "fundamenty", sort: 14 }),
  make("foundations", "rulonnaya-gidro",       "Рулонная гидроизоляция",                 { unit: "м²", from: 1500, slug: "fundamenty", sort: 15 }),
  make("foundations", "uteplenie",             "Утепление фундамента",                   { unit: "м²", from: 900,  slug: "fundamenty", sort: 16 }),
  make("foundations", "pristennyy-drenazh",    "Пристенный дренаж",                      { unit: "пог. м", from: 3500, slug: "fundamenty", sort: 17 }),
  make("foundations", "koltsevoy-drenazh",     "Кольцевой дренаж",                       { unit: "пог. м", from: 2500, slug: "fundamenty", sort: 18 }),
  make("foundations", "otmostka",              "Устройство отмостки",                    { unit: "м²", from: 2500, slug: "fundamenty", sort: 19 }),
  make("foundations", "vvod-truby",            "Ввод инженерной трубы через фундамент",  { unit: "шт.", from: 3000, slug: "fundamenty", sort: 20 }),
];

// ── 7. КЛАДОЧНЫЕ РАБОТЫ (18) ──────────────────────────────────────────────
const MASONRY: PriceItem[] = [
  make("masonry", "gazobeton-naruzh",       "Кладка наружных стен из газобетона",     { unit: "м³", from: 7000, slug: "kladochnye-raboty", sort: 1 }),
  make("masonry", "gazosilikat-naruzh",     "Кладка наружных стен из газосиликата",   { unit: "м³", from: 7000, slug: "kladochnye-raboty", sort: 2 }),
  make("masonry", "penobeton",              "Кладка пенобетонных блоков",             { unit: "м³", from: 7000, slug: "kladochnye-raboty", sort: 3 }),
  make("masonry", "keramoblok",             "Кладка керамических блоков",             { unit: "м³", from: 7500, slug: "kladochnye-raboty", sort: 4 }),
  make("masonry", "keramzitobeton",         "Кладка керамзитобетонных блоков",        { unit: "м³", from: 8000, slug: "kladochnye-raboty", sort: 5 }),
  make("masonry", "ryadovoy-kirpich",       "Кладка рядового кирпича",                { unit: "м³", from: 9500, slug: "kladochnye-raboty", sort: 6 }),
  make("masonry", "peregorodki-gazobeton",  "Перегородки из газобетона",              { unit: "м²", from: 1700, slug: "kladochnye-raboty", sort: 7 }),
  make("masonry", "peregorodki-pgp",        "Перегородки из ПГП",                     { unit: "м²", from: 1500, slug: "kladochnye-raboty", sort: 8 }),
  make("masonry", "peregorodki-keramoblok", "Перегородки из керамических блоков",     { unit: "м²", from: 1800, slug: "kladochnye-raboty", sort: 9 }),
  make("masonry", "kirpichnaya-120",        "Кирпичная перегородка 120 мм",           { unit: "м²", from: 2300, slug: "kladochnye-raboty", sort: 10 }),
  make("masonry", "oblitsovochnyy",         "Облицовочный кирпич",                    { unit: "м²", from: 5200, slug: "kladochnye-raboty", sort: 11 }),
  make("masonry", "klinker",                "Клинкерный кирпич",                      { unit: "м²", from: 5500, slug: "kladochnye-raboty", sort: 12 }),
  make("masonry", "figurnaya",              "Фигурная облицовочная кладка",           { unit: "м²", from: 6500, slug: "kladochnye-raboty", sort: 13 }),
  make("masonry", "gazobeton-peremychka",   "Монтаж газобетонной перемычки",          { unit: "шт.", from: 1200, slug: "kladochnye-raboty", sort: 14 }),
  make("masonry", "zhb-peremychka",         "Монтаж железобетонной перемычки",        { unit: "шт.", from: 2000, slug: "kladochnye-raboty", sort: 15 }),
  make("masonry", "armirovanie",            "Армирование кладки",                     { unit: "пог. м", from: 250, slug: "kladochnye-raboty", sort: 16 }),
  make("masonry", "armopoyas",              "Устройство армопояса",                   { unit: "м³", from: 22000, slug: "kladochnye-raboty", sort: 17 }),
  make("masonry", "uteplenie-min-vata",     "Утепление стен минеральной ватой",       { unit: "м²", from: 700, slug: "kladochnye-raboty", sort: 18 }),
];

// ── 8. КРОВЕЛЬНЫЕ РАБОТЫ (21 отдельных + 7 комплексных = 28) ──────────────
const ROOFING: PriceItem[] = [
  make("roofing", "mauerlat",                "Монтаж мауэрлата",                              { unit: "пог. м", from: 1200, slug: "krovelnye-raboty", sort: 1 }),
  make("roofing", "stropilka",               "Монтаж стропильной системы",                    { unit: "м²", unitLabel: "м² кровли", from: 1800, slug: "krovelnye-raboty", sort: 2 }),
  make("roofing", "kontrobreshetka",         "Контробрешётка",                                { unit: "м²", from: 350, slug: "krovelnye-raboty", sort: 3 }),
  make("roofing", "obreshetka",              "Шаговая обрешётка",                             { unit: "м²", from: 500, slug: "krovelnye-raboty", sort: 4 }),
  make("roofing", "sploshnoe-osnovanie",     "Сплошное основание из фанеры или OSB",          { unit: "м²", from: 750, slug: "krovelnye-raboty", sort: 5 }),
  make("roofing", "paroizolyatsiya",         "Пароизоляция",                                  { unit: "м²", from: 300, slug: "krovelnye-raboty", sort: 6 }),
  make("roofing", "gidrovetrozaschita",      "Гидроветрозащитная мембрана",                   { unit: "м²", from: 300, slug: "krovelnye-raboty", sort: 7 }),
  make("roofing", "uteplenie",               "Утепление кровли",                              { unit: "м²", from: 1100, slug: "krovelnye-raboty", sort: 8 }),
  make("roofing", "metallocherepitsa",       "Монтаж металлочерепицы",                        { unit: "м²", from: 1200, slug: "krovelnye-raboty", sort: 9 }),
  make("roofing", "profnastil",              "Монтаж профилированного листа",                 { unit: "м²", from: 1100, slug: "krovelnye-raboty", sort: 10 }),
  make("roofing", "gibkaya",                 "Монтаж гибкой черепицы",                        { unit: "м²", from: 1800, slug: "krovelnye-raboty", sort: 11 }),
  make("roofing", "naturalnaya",             "Монтаж натуральной черепицы",                   { unit: "м²", from: 2500, slug: "krovelnye-raboty", sort: 12 }),
  make("roofing", "falts",                   "Монтаж фальцевой кровли",                       { unit: "м²", from: 2800, slug: "krovelnye-raboty", sort: 13 }),
  make("roofing", "pvh-membrana",            "Монтаж ПВХ-мембраны на готовое основание",      { unit: "м²", from: 1100, slug: "krovelnye-raboty", sort: 14 }),
  make("roofing", "naplav-odin",             "Наплавляемая кровля в один слой",               { unit: "м²", from: 700, slug: "krovelnye-raboty", sort: 15 }),
  make("roofing", "naplav-dva",              "Наплавляемая кровля в два слоя",                { unit: "м²", from: 1300, slug: "krovelnye-raboty", sort: 16 }),
  make("roofing", "vodostok",                "Монтаж водосточной системы",                    { unit: "пог. м", from: 1200, slug: "krovelnye-raboty", sort: 17 }),
  make("roofing", "podshivka",               "Подшивка карнизов",                             { unit: "пог. м", from: 1100, slug: "krovelnye-raboty", sort: 18 }),
  make("roofing", "snegozaderzhateli",       "Монтаж снегозадержателей",                      { unit: "пог. м", from: 1000, slug: "krovelnye-raboty", sort: 19 }),
  make("roofing", "primykania",              "Монтаж примыканий",                             { unit: "пог. м", from: 1300, slug: "krovelnye-raboty", sort: 20 }),
  make("roofing", "voronka",                 "Монтаж кровельной воронки",                     { unit: "шт.", from: 5000, slug: "krovelnye-raboty", sort: 21 }),
  make("roofing", "complex-holodnaya",       "Холодная скатная кровля (комплекс)",            { unit: "м²", unitLabel: "м² кровли", from: 3500, slug: "krovelnye-raboty", sort: 22 }),
  make("roofing", "complex-utepl-metall",    "Утеплённая кровля с металлочерепицей (комплекс)", { unit: "м²", unitLabel: "м² кровли", from: 6500, slug: "krovelnye-raboty", sort: 23 }),
  make("roofing", "complex-utepl-gibkaya",   "Утеплённая кровля с гибкой черепицей (комплекс)", { unit: "м²", unitLabel: "м² кровли", from: 7500, slug: "krovelnye-raboty", sort: 24 }),
  make("roofing", "complex-falts",           "Фальцевая кровля (комплекс)",                   { unit: "м²", unitLabel: "м² кровли", from: 8500, slug: "krovelnye-raboty", sort: 25 }),
  make("roofing", "complex-naturalnaya",     "Натуральная черепица (комплекс)",               { unit: "м²", unitLabel: "м² кровли", from: 8000, slug: "krovelnye-raboty", sort: 26 }),
  make("roofing", "complex-ploskaya",        "Плоская неэксплуатируемая кровля (комплекс)",   { unit: "м²", unitLabel: "м² кровли", from: 5500, slug: "krovelnye-raboty", sort: 27 }),
  make("roofing", "complex-ekspluat",        "Эксплуатируемая кровля (комплекс)",             { unit: "м²", unitLabel: "м² кровли", from: 9000, slug: "krovelnye-raboty", sort: 28 }),
];

// ── 9. ФАСАДНЫЕ РАБОТЫ (15) ───────────────────────────────────────────────
const FACADES: PriceItem[] = [
  make("facades", "podgotovka",            "Подготовка основания фасада",                { unit: "м²", from: 500,  slug: "fasadnye-raboty", sort: 1 }),
  make("facades", "shtukaturka-bez-utepl", "Штукатурка фасада без утепления",            { unit: "м²", from: 2500, slug: "fasadnye-raboty", sort: 2 }),
  make("facades", "mokryy",                "Мокрый фасад с утеплением",                  { unit: "м²", from: 4800, slug: "fasadnye-raboty", sort: 3 }),
  make("facades", "dekor-shtuk",           "Декоративная штукатурка",                    { unit: "м²", from: 900,  slug: "fasadnye-raboty", sort: 4 }),
  make("facades", "pokraska",              "Покраска фасада",                            { unit: "м²", from: 500,  slug: "fasadnye-raboty", sort: 5 }),
  make("facades", "vinyl-siding",          "Монтаж винилового сайдинга",                 { unit: "м²", from: 1800, slug: "fasadnye-raboty", sort: 6 }),
  make("facades", "metal-siding",          "Монтаж металлического сайдинга",             { unit: "м²", from: 2000, slug: "fasadnye-raboty", sort: 7 }),
  make("facades", "fibrocement",           "Монтаж фиброцементного сайдинга",            { unit: "м²", from: 2500, slug: "fasadnye-raboty", sort: 8 }),
  make("facades", "planken",               "Монтаж планкена",                            { unit: "м²", from: 3800, slug: "fasadnye-raboty", sort: 9 }),
  make("facades", "klinker-plitka",        "Монтаж клинкерной плитки",                   { unit: "м²", from: 4500, slug: "fasadnye-raboty", sort: 10 }),
  make("facades", "oblitsovka-kirpich",    "Облицовка кирпичом",                         { unit: "м²", from: 5200, slug: "fasadnye-raboty", sort: 11 }),
  make("facades", "vent-keramogranit",     "Вентилируемый фасад из керамогранита",       { unit: "м²", from: 6500, slug: "fasadnye-raboty", sort: 12 }),
  make("facades", "vent-metallokassety",   "Вентилируемый фасад из металлокассет",       { unit: "м²", from: 7000, slug: "fasadnye-raboty", sort: 13 }),
  make("facades", "naturalnyy-kamen",      "Облицовка натуральным камнем",               { unit: "м²", from: 7500, slug: "fasadnye-raboty", sort: 14 }),
  make("facades", "uteplenie-min-vata",    "Утепление фасада минеральной ватой",         { unit: "м²", from: 1200, slug: "fasadnye-raboty", sort: 15 }),
];

// ── 10. ГЕНЕРАЛЬНЫЙ ПОДРЯД (7) ────────────────────────────────────────────
const GENERAL_CONTRACTING: PriceItem[] = [
  make("general_contracting", "coordination", "Координация подрядчиков и документооборота",         { unit: "%", pctFrom: 3,  slug: "generalnyy-podryad", note: "от стоимости СМР", sort: 1 }),
  make("general_contracting", "full",         "Полноценное управление генеральным подрядом",         { unit: "%", pctFrom: 5,  slug: "generalnyy-podryad", note: "от стоимости СМР", sort: 2 }),
  make("general_contracting", "logistics",    "Генподряд с обеспечением логистики, техники и инфраструктуры", { unit: "%", pctFrom: 7, slug: "generalnyy-podryad", note: "от стоимости СМР", sort: 3 }),
  make("general_contracting", "complex",      "Сложные объекты с расширенной ответственностью",      { unit: "%", pctFrom: 10, slug: "generalnyy-podryad", note: "от стоимости СМР", sort: 4 }),
  make("general_contracting", "pm",           "Выделенный руководитель проекта",                     { unit: "месяц", from: 250000, slug: "generalnyy-podryad", sort: 5 }),
  make("general_contracting", "qa-engineer",  "Инженер строительного контроля",                      { unit: "месяц", from: 180000, slug: "generalnyy-podryad", sort: 6 }),
  make("general_contracting", "docs",         "Ведение исполнительной документации",                 { unit: "месяц", from: 150000, slug: "generalnyy-podryad", sort: 7 }),
];

// ── 11. ПАКЕТЫ ЭЛЕКТРОМОНТАЖА (3) ─────────────────────────────────────────
const ELECTRICAL_PACKAGES: PriceItem[] = [
  make("electrical_packages", "basic",    "Электромонтаж — базовый",  { unit: "м²", from: 2500, slug: "elektromontazh", sort: 1 }),
  make("electrical_packages", "standard", "Электромонтаж — стандарт", { unit: "м²", from: 3500, slug: "elektromontazh", sort: 2 }),
  make("electrical_packages", "premium",  "Электромонтаж — премиум",  { unit: "м²", from: 5000, slug: "elektromontazh", sort: 3 }),
];

// ── 12. ОТДЕЛЬНЫЕ ЭЛЕКТРОМОНТАЖНЫЕ РАБОТЫ (22) ────────────────────────────
const ELECTRICAL: PriceItem[] = [
  make("electrical", "elektroproekt",            "Электропроект",                                          { unit: "м²", from: 350, slug: "elektromontazh", sort: 1 }),
  make("electrical", "elektroproekt-min",        "Электропроект, минимальная стоимость",                   { unit: "комплект", from: 25000, slug: "elektromontazh", sort: 2 }),
  make("electrical", "chernovaya-tochka",        "Комплексная черновая электроточка",                      { unit: "шт.", from: 1800, slug: "elektromontazh", sort: 3 }),
  make("electrical", "podrozetnik",              "Установка подрозетника",                                 { unit: "шт.", from: 600, slug: "elektromontazh", sort: 4 }),
  make("electrical", "rozetka-vykl",             "Установка розетки или выключателя",                      { unit: "шт.", from: 650, slug: "elektromontazh", sort: 5 }),
  make("electrical", "kabel-otkr",               "Прокладка кабеля открытым способом",                     { unit: "пог. м", from: 180, slug: "elektromontazh", sort: 6 }),
  make("electrical", "kabel-gofra",              "Прокладка кабеля в гофре",                               { unit: "пог. м", from: 250, slug: "elektromontazh", sort: 7 }),
  make("electrical", "kabelnyy-lotok",           "Монтаж кабельного лотка",                                { unit: "пог. м", from: 500, slug: "elektromontazh", sort: 8 }),
  make("electrical", "shtroblenie-gazobeton",    "Штробление газобетона",                                  { unit: "пог. м", from: 350, slug: "elektromontazh", sort: 9 }),
  make("electrical", "shtroblenie-kirpich",      "Штробление кирпича",                                     { unit: "пог. м", from: 500, slug: "elektromontazh", sort: 10 }),
  make("electrical", "shtroblenie-beton",        "Штробление бетона",                                      { unit: "пог. м", from: 800, slug: "elektromontazh", sort: 11 }),
  make("electrical", "sverlenie-podrozetnik",    "Сверление отверстия под подрозетник в бетоне",           { unit: "шт.", from: 900, slug: "elektromontazh", sort: 12 }),
  make("electrical", "vnutr-shchit",             "Установка внутреннего электрощита",                      { unit: "шт.", from: 10000, slug: "elektromontazh", sort: 13 }),
  make("electrical", "sborka-shchit-24",         "Сборка щита до 24 модулей",                              { unit: "комплект", from: 20000, slug: "elektromontazh", sort: 14 }),
  make("electrical", "sborka-shchit-54",         "Сборка щита до 54 модулей",                              { unit: "комплект", from: 40000, slug: "elektromontazh", sort: 15 }),
  make("electrical", "podklyuchenie-avtomata",   "Подключение автомата",                                   { unit: "модуль", from: 1000, slug: "elektromontazh", sort: 16 }),
  make("electrical", "svetilnik",                "Монтаж светильника",                                     { unit: "шт.", from: 1000, slug: "elektromontazh", sort: 17 }),
  make("electrical", "lyustra",                  "Монтаж люстры",                                          { unit: "шт.", from: 2500, slug: "elektromontazh", sort: 18 }),
  make("electrical", "svetodiodnaya-lenta",      "Монтаж светодиодной ленты",                              { unit: "пог. м", from: 800, slug: "elektromontazh", sort: 19 }),
  make("electrical", "kontur-zazemlenia",        "Монтаж контура заземления",                              { unit: "комплект", from: 35000, slug: "elektromontazh", sort: 20 }),
  make("electrical", "proverka",                 "Проверка и измерения",                                   { unit: "комплект", from: 20000, slug: "elektromontazh", sort: 21 }),
  make("electrical", "ispolnitelnaya",           "Исполнительная схема",                                   { unit: "комплект", from: 15000, slug: "elektromontazh", sort: 22 }),
];

// ── 13. ПАКЕТЫ САНТЕХНИКИ (5) ─────────────────────────────────────────────
const PLUMBING_PACKAGES: PriceItem[] = [
  make("plumbing_packages", "studio",       "Черновая сантехника студии",                  { unit: "комплект", from: 120000, slug: "santehnika", sort: 1 }),
  make("plumbing_packages", "1kkv",         "Черновая сантехника однокомнатной квартиры",  { unit: "комплект", from: 160000, slug: "santehnika", sort: 2 }),
  make("plumbing_packages", "2kkv",         "Черновая сантехника двухкомнатной квартиры",  { unit: "комплект", from: 220000, slug: "santehnika", sort: 3 }),
  make("plumbing_packages", "3kkv",         "Черновая сантехника трёхкомнатной квартиры",  { unit: "комплект", from: 280000, slug: "santehnika", sort: 4 }),
  make("plumbing_packages", "chastnyy-dom", "Сантехника частного дома",                    { unit: "м²", unitLabel: "м² площади дома", from: 2500, slug: "santehnika", sort: 5 }),
];

// ── 14. ОТДЕЛЬНЫЕ САНТЕХНИЧЕСКИЕ РАБОТЫ (21) ──────────────────────────────
const PLUMBING: PriceItem[] = [
  make("plumbing", "tochka-vody",            "Точка водоснабжения",                  { unit: "точка", from: 3500, slug: "santehnika", sort: 1 }),
  make("plumbing", "tochka-kanalizatsii",    "Точка канализации",                    { unit: "точка", from: 2500, slug: "santehnika", sort: 2 }),
  make("plumbing", "kompleksnaya-tochka",    "Комплексная сантехническая точка",     { unit: "точка", from: 5500, slug: "santehnika", sort: 3 }),
  make("plumbing", "truba-vody",             "Прокладка трубы водоснабжения",        { unit: "пог. м", from: 500, slug: "santehnika", sort: 4 }),
  make("plumbing", "kanaliz-50",             "Прокладка канализационной трубы 50 мм",{ unit: "пог. м", from: 600, slug: "santehnika", sort: 5 }),
  make("plumbing", "kanaliz-110",            "Прокладка канализационной трубы 110 мм",{ unit: "пог. м", from: 900, slug: "santehnika", sort: 6 }),
  make("plumbing", "kollektornyy-uzel",      "Коллекторный узел",                    { unit: "комплект", from: 25000, slug: "santehnika", sort: 7 }),
  make("plumbing", "zashchita-protechek",    "Установка системы защиты от протечек", { unit: "комплект", from: 8000, slug: "santehnika", sort: 8 }),
  make("plumbing", "filtr",                  "Монтаж фильтра",                       { unit: "шт.", from: 2000, slug: "santehnika", sort: 9 }),
  make("plumbing", "reduktor",               "Монтаж редуктора",                     { unit: "шт.", from: 2000, slug: "santehnika", sort: 10 }),
  make("plumbing", "installyatsiya",         "Установка инсталляции",                { unit: "шт.", from: 9000, slug: "santehnika", sort: 11 }),
  make("plumbing", "napol-unitaz",           "Установка напольного унитаза",         { unit: "шт.", from: 5000, slug: "santehnika", sort: 12 }),
  make("plumbing", "podvesnoy-unitaz",       "Установка подвесного унитаза",         { unit: "шт.", from: 5500, slug: "santehnika", sort: 13 }),
  make("plumbing", "rakovina",               "Установка раковины",                   { unit: "шт.", from: 4000, slug: "santehnika", sort: 14 }),
  make("plumbing", "smesitel",               "Установка смесителя",                  { unit: "шт.", from: 2500, slug: "santehnika", sort: 15 }),
  make("plumbing", "vanna",                  "Установка ванны",                      { unit: "шт.", from: 6000, slug: "santehnika", sort: 16 }),
  make("plumbing", "dush-poddon",            "Установка душевого поддона",           { unit: "шт.", from: 8000, slug: "santehnika", sort: 17 }),
  make("plumbing", "dush-kabina",            "Установка душевой кабины",             { unit: "шт.", from: 12000, slug: "santehnika", sort: 18 }),
  make("plumbing", "polotentsesushitel",     "Установка полотенцесушителя",          { unit: "шт.", from: 5000, slug: "santehnika", sort: 19 }),
  make("plumbing", "boyler",                 "Установка бойлера",                    { unit: "шт.", from: 8000, slug: "santehnika", sort: 20 }),
  make("plumbing", "opressovka",             "Опрессовка системы",                   { unit: "комплект", from: 10000, slug: "santehnika", sort: 21 }),
];

// ── 15. ВОДОСНАБЖЕНИЕ И КАНАЛИЗАЦИЯ (13) ──────────────────────────────────
const WATER_SUPPLY: PriceItem[] = [
  make("water_supply", "proekt-vody",        "Проект водоснабжения",              { unit: "м²", unitLabel: "м² дома", from: 150, slug: "vodosnabzhenie-kanalizatsiya", sort: 1 }),
  make("water_supply", "proekt-kanalizatsii","Проект канализации",                { unit: "м²", unitLabel: "м² дома", from: 150, slug: "vodosnabzhenie-kanalizatsiya", sort: 2 }),
  make("water_supply", "vvod-vody",          "Ввод воды в дом",                   { unit: "комплект", from: 35000, slug: "vodosnabzhenie-kanalizatsiya", sort: 3 }),
  make("water_supply", "nasos",              "Монтаж насосного оборудования",     { unit: "комплект", from: 25000, slug: "vodosnabzhenie-kanalizatsiya", sort: 4 }),
  make("water_supply", "gidroakkumulyator",  "Монтаж гидроаккумулятора",          { unit: "шт.", from: 7000, slug: "vodosnabzhenie-kanalizatsiya", sort: 5 }),
  make("water_supply", "vodoochistka",       "Монтаж водоочистки",                { unit: "комплект", from: 30000, slug: "vodosnabzhenie-kanalizatsiya", sort: 6 }),
  make("water_supply", "vnutr-vody",         "Внутренняя разводка водоснабжения", { unit: "точка", from: 3500, slug: "vodosnabzhenie-kanalizatsiya", sort: 7 }),
  make("water_supply", "vnutr-kanaliz",      "Внутренняя канализация",            { unit: "точка", from: 2500, slug: "vodosnabzhenie-kanalizatsiya", sort: 8 }),
  make("water_supply", "naruzh-vodoprovod",  "Наружный водопровод",               { unit: "пог. м", from: 1500, slug: "vodosnabzhenie-kanalizatsiya", sort: 9 }),
  make("water_supply", "naruzh-kanaliz",     "Наружная канализация",              { unit: "пог. м", from: 1800, slug: "vodosnabzhenie-kanalizatsiya", sort: 10 }),
  make("water_supply", "septic",             "Монтаж септика",                    { unit: "комплект", from: 60000, slug: "vodosnabzhenie-kanalizatsiya", sort: 11 }),
  make("water_supply", "kolodets",           "Монтаж канализационного колодца",   { unit: "шт.", from: 30000, slug: "vodosnabzhenie-kanalizatsiya", sort: 12 }),
  make("water_supply", "greyushchiy-kabel",  "Монтаж греющего кабеля",            { unit: "пог. м", from: 600, slug: "vodosnabzhenie-kanalizatsiya", sort: 13 }),
];

// ── 16. ПАКЕТЫ ОТОПЛЕНИЯ (6) ──────────────────────────────────────────────
const HEATING_PACKAGES: PriceItem[] = [
  make("heating_packages", "bazovoe",            "Базовое отопление частного дома",                    { unit: "м²", from: 1800, slug: "otoplenie", sort: 1 }),
  make("heating_packages", "standart",           "Отопление стандартного уровня",                      { unit: "м²", from: 2800, slug: "otoplenie", sort: 2 }),
  make("heating_packages", "slozhnoe",           "Сложная система с котельной и автоматикой",          { unit: "м²", from: 4000, slug: "otoplenie", sort: 3 }),
  make("heating_packages", "kvartira",           "Отопление квартиры",                                 { unit: "м²", from: 2500, slug: "otoplenie", sort: 4 }),
  make("heating_packages", "kotelnaya-baza",     "Котельная базового уровня",                          { unit: "комплект", from: 150000, slug: "otoplenie", sort: 5 }),
  make("heating_packages", "kotelnaya-slozhnaya","Котельная повышенной сложности",                     { unit: "комплект", from: 300000, slug: "otoplenie", sort: 6 }),
];

// ── 17. ОТДЕЛЬНЫЕ РАБОТЫ ПО ОТОПЛЕНИЮ (18) ────────────────────────────────
const HEATING: PriceItem[] = [
  make("heating", "teplotekhnicheskiy", "Теплотехнический расчёт",         { unit: "м²", from: 100, slug: "otoplenie", sort: 1 }),
  make("heating", "proekt",             "Проект отопления",                { unit: "м²", from: 200, slug: "otoplenie", sort: 2 }),
  make("heating", "proekt-min",         "Проект отопления, минимальная стоимость", { unit: "комплект", from: 30000, slug: "otoplenie", sort: 3 }),
  make("heating", "radiator",           "Монтаж радиатора",                { unit: "шт.", from: 6000, slug: "otoplenie", sort: 4 }),
  make("heating", "konvektor",          "Монтаж внутрипольного конвектора",{ unit: "шт.", from: 12000, slug: "otoplenie", sort: 5 }),
  make("heating", "truba",              "Монтаж трубы отопления",          { unit: "пог. м", from: 500, slug: "otoplenie", sort: 6 }),
  make("heating", "kollektor",          "Монтаж коллектора",               { unit: "шт.", from: 8000, slug: "otoplenie", sort: 7 }),
  make("heating", "kollektornyy-shkaf", "Монтаж коллекторного шкафа",      { unit: "шт.", from: 5000, slug: "otoplenie", sort: 8 }),
  make("heating", "gazovyy-kotel-nast", "Монтаж настенного газового котла",{ unit: "шт.", from: 20000, slug: "otoplenie", sort: 9 }),
  make("heating", "elektrokotel",       "Монтаж электрического котла",     { unit: "шт.", from: 15000, slug: "otoplenie", sort: 10 }),
  make("heating", "napolnyy-kotel",     "Монтаж напольного котла",         { unit: "шт.", from: 25000, slug: "otoplenie", sort: 11 }),
  make("heating", "boyler-kosvenny",    "Монтаж бойлера косвенного нагрева",{ unit: "шт.", from: 15000, slug: "otoplenie", sort: 12 }),
  make("heating", "gidrostrelka",       "Монтаж гидрострелки",             { unit: "шт.", from: 10000, slug: "otoplenie", sort: 13 }),
  make("heating", "nasosnaya-gruppa",   "Монтаж насосной группы",          { unit: "шт.", from: 8000, slug: "otoplenie", sort: 14 }),
  make("heating", "opressovka",         "Опрессовка",                      { unit: "комплект", from: 15000, slug: "otoplenie", sort: 15 }),
  make("heating", "zapolnenie",         "Заполнение и запуск системы",     { unit: "комплект", from: 15000, slug: "otoplenie", sort: 16 }),
  make("heating", "balansirovka",       "Гидравлическая балансировка",     { unit: "комплект", from: 25000, slug: "otoplenie", sort: 17 }),
  make("heating", "pusconaladka",       "Пусконаладка котельной",          { unit: "комплект", from: 30000, slug: "otoplenie", sort: 18 }),
];

// ── 18. ТЁПЛЫЙ ПОЛ (10) ───────────────────────────────────────────────────
const UNDERFLOOR_HEATING: PriceItem[] = [
  make("underfloor_heating", "proekt-vodyanogo",    "Проект водяного тёплого пола", { unit: "м²", from: 150, slug: "teplyy-pol", sort: 1 }),
  make("underfloor_heating", "utepl",               "Укладка утеплителя",           { unit: "м²", from: 400, slug: "teplyy-pol", sort: 2 }),
  make("underfloor_heating", "dempferka",           "Монтаж демпферной ленты",      { unit: "пог. м", from: 150, slug: "teplyy-pol", sort: 3 }),
  make("underfloor_heating", "setka",               "Монтаж армирующей сетки",      { unit: "м²", from: 300, slug: "teplyy-pol", sort: 4 }),
  make("underfloor_heating", "truba-tp",            "Монтаж трубы водяного тёплого пола", { unit: "м²", from: 1200, slug: "teplyy-pol", sort: 5 }),
  make("underfloor_heating", "kollektor",           "Монтаж коллектора",            { unit: "шт.", from: 8000, slug: "teplyy-pol", sort: 6 }),
  make("underfloor_heating", "kollektornyy-shkaf", "Монтаж коллекторного шкафа",    { unit: "шт.", from: 5000, slug: "teplyy-pol", sort: 7 }),
  make("underfloor_heating", "opressovka",          "Опрессовка",                   { unit: "контур", from: 2000, slug: "teplyy-pol", sort: 8 }),
  make("underfloor_heating", "elektricheskiy",      "Монтаж электрического тёплого пола", { unit: "м²", from: 1200, slug: "teplyy-pol", sort: 9 }),
  make("underfloor_heating", "termoregulyator",     "Установка терморегулятора",    { unit: "шт.", from: 2500, slug: "teplyy-pol", sort: 10 }),
];

// ── 19. ПЛИТОЧНЫЕ РАБОТЫ (20) ─────────────────────────────────────────────
const TILING: PriceItem[] = [
  make("tiling", "standart-keram",     "Укладка стандартной керамической плитки",      { unit: "м²", from: 2800, slug: "ukladka-plitki", sort: 1 }),
  make("tiling", "keramogranit-600",   "Укладка керамогранита до 600×1200 мм",         { unit: "м²", from: 3500, slug: "ukladka-plitki", sort: 2 }),
  make("tiling", "plitka-1200",        "Укладка плитки до 1200 мм",                    { unit: "м²", from: 3500, slug: "ukladka-plitki", sort: 3 }),
  make("tiling", "krupnoformat",       "Укладка крупноформатного керамогранита",       { unit: "м²", from: 6000, slug: "ukladka-plitki", sort: 4 }),
  make("tiling", "plity-3200",         "Укладка плит до 3200 мм",                      { unit: "м²", from: 8000, slug: "ukladka-plitki", sort: 5 }),
  make("tiling", "mozaika",            "Укладка мозаики",                              { unit: "м²", from: 5000, slug: "ukladka-plitki", sort: 6 }),
  make("tiling", "kabanchik",          "Укладка плитки «кабанчик»",                    { unit: "м²", from: 5000, slug: "ukladka-plitki", sort: 7 }),
  make("tiling", "diagonal",           "Укладка по диагонали",                         { unit: "м²", from: 4000, slug: "ukladka-plitki", sort: 8 }),
  make("tiling", "elochka",            "Укладка ёлочкой",                              { unit: "м²", from: 4500, slug: "ukladka-plitki", sort: 9 }),
  make("tiling", "zapil-45",           "Запил кромки под 45 градусов",                 { unit: "пог. м", from: 1500, slug: "ukladka-plitki", sort: 10 }),
  make("tiling", "otverstie",          "Изготовление отверстия",                       { unit: "шт.", from: 1000, slug: "ukladka-plitki", sort: 11 }),
  make("tiling", "epoxide",            "Эпоксидная затирка",                           { unit: "м²", from: 1200, slug: "ukladka-plitki", sort: 12 }),
  make("tiling", "cement-zatirka",     "Цементная затирка",                            { unit: "м²", from: 500,  slug: "ukladka-plitki", sort: 13 }),
  make("tiling", "gidroizolyatsiya",   "Гидроизоляция",                                { unit: "м²", from: 900,  slug: "ukladka-plitki", sort: 14 }),
  make("tiling", "vyravnivanie",       "Выравнивание основания",                       { unit: "м²", from: 1200, slug: "ukladka-plitki", sort: 15 }),
  make("tiling", "uklon",              "Формирование уклона",                          { unit: "м²", from: 1500, slug: "ukladka-plitki", sort: 16 }),
  make("tiling", "stupeni",            "Облицовка ступеней",                           { unit: "пог. м", from: 4000, slug: "ukladka-plitki", sort: 17 }),
  make("tiling", "plintus",            "Монтаж плиточного плинтуса",                   { unit: "пог. м", from: 1000, slug: "ukladka-plitki", sort: 18 }),
  make("tiling", "ekran-vanny",        "Изготовление экрана ванной под плитку",        { unit: "комплект", from: 20000, slug: "ukladka-plitki", sort: 19 }),
  make("tiling", "dush-poddon",        "Облицовка душевого поддона",                   { unit: "комплект", from: 30000, slug: "ukladka-plitki", sort: 20 }),
];

// ── 20. ОТДЕЛОЧНЫЕ РАБОТЫ — СТЕНЫ (12) ────────────────────────────────────
const FINISHING_WALLS: PriceItem[] = [
  make("finishing_walls", "gruntovanie",         "Грунтование стен",                  { unit: "м²", from: 150, slug: "chistovaya-otdelka", sort: 1 }),
  make("finishing_walls", "shtukaturka-mayaki",  "Штукатурка стен по маякам",         { unit: "м²", from: 1000, slug: "chistovaya-otdelka", sort: 2 }),
  make("finishing_walls", "shpaklevka-oboi",     "Шпаклевание под обои",              { unit: "м²", from: 1100, slug: "chistovaya-otdelka", sort: 3 }),
  make("finishing_walls", "shpaklevka-pokraska", "Шпаклевание под покраску",          { unit: "м²", from: 1800, slug: "chistovaya-otdelka", sort: 4 }),
  make("finishing_walls", "proyavochnyy-svet",   "Подготовка под проявочный свет",    { unit: "м²", from: 2500, slug: "chistovaya-otdelka", sort: 5 }),
  make("finishing_walls", "steklokholst",        "Оклейка стеклохолстом",             { unit: "м²", from: 500,  slug: "chistovaya-otdelka", sort: 6 }),
  make("finishing_walls", "pokraska",            "Покраска стен в два слоя",          { unit: "м²", from: 650,  slug: "chistovaya-otdelka", sort: 7 }),
  make("finishing_walls", "oboi",                "Поклейка обоев",                    { unit: "м²", from: 650,  slug: "chistovaya-otdelka", sort: 8 }),
  make("finishing_walls", "dekor-shtuk",         "Декоративная штукатурка",           { unit: "м²", from: 1800, slug: "chistovaya-otdelka", sort: 9 }),
  make("finishing_walls", "mikrocement",         "Микроцемент",                       { unit: "м²", from: 4000, slug: "chistovaya-otdelka", sort: 10 }),
  make("finishing_walls", "peregorodka-gkl",     "Перегородка из ГКЛ",                { unit: "м²", from: 1800, slug: "chistovaya-otdelka", sort: 11 }),
  make("finishing_walls", "obshivka-gkl",        "Обшивка стены ГКЛ",                 { unit: "м²", from: 1700, slug: "chistovaya-otdelka", sort: 12 }),
];

// ── 21. ОТДЕЛОЧНЫЕ РАБОТЫ — ПОЛЫ (9) ──────────────────────────────────────
const FINISHING_FLOORS: PriceItem[] = [
  make("finishing_floors", "polusukhaya",        "Полусухая стяжка",                 { unit: "м²", from: 900,  slug: "chistovaya-otdelka", sort: 1 }),
  make("finishing_floors", "csp-styazka",        "Цементно-песчаная стяжка",         { unit: "м²", from: 1100, slug: "chistovaya-otdelka", sort: 2 }),
  make("finishing_floors", "nalivnoy",           "Наливной пол",                     { unit: "м²", from: 650,  slug: "chistovaya-otdelka", sort: 3 }),
  make("finishing_floors", "laminat",            "Укладка ламината",                 { unit: "м²", from: 850,  slug: "chistovaya-otdelka", sort: 4 }),
  make("finishing_floors", "kvartsvinil",        "Укладка кварцвинила",              { unit: "м²", from: 1000, slug: "chistovaya-otdelka", sort: 5 }),
  make("finishing_floors", "inzhenernaya",       "Укладка инженерной доски",         { unit: "м²", from: 1800, slug: "chistovaya-otdelka", sort: 6 }),
  make("finishing_floors", "parquet",            "Укладка паркета",                  { unit: "м²", from: 2500, slug: "chistovaya-otdelka", sort: 7 }),
  make("finishing_floors", "plintus",            "Монтаж плинтуса",                  { unit: "пог. м", from: 500, slug: "chistovaya-otdelka", sort: 8 }),
  make("finishing_floors", "skrytyy-plintus",    "Монтаж скрытого плинтуса",         { unit: "пог. м", from: 1500, slug: "chistovaya-otdelka", sort: 9 }),
];

// ── 22. ОТДЕЛОЧНЫЕ РАБОТЫ — ПОТОЛКИ (6) ───────────────────────────────────
const FINISHING_CEILINGS: PriceItem[] = [
  make("finishing_ceilings", "gkl-odin",          "Потолок из ГКЛ в один уровень",   { unit: "м²", from: 2200, slug: "chistovaya-otdelka", sort: 1 }),
  make("finishing_ceilings", "mnogourovnevyy",    "Многоуровневый потолок",          { unit: "м²", from: 3500, slug: "chistovaya-otdelka", sort: 2 }),
  make("finishing_ceilings", "tenevoe",           "Теневое примыкание",              { unit: "пог. м", from: 1500, slug: "chistovaya-otdelka", sort: 3 }),
  make("finishing_ceilings", "skrytyy-karniz",    "Скрытый карниз",                  { unit: "пог. м", from: 2000, slug: "chistovaya-otdelka", sort: 4 }),
  make("finishing_ceilings", "shpaklevka",        "Шпаклевание потолка под покраску",{ unit: "м²", from: 2000, slug: "chistovaya-otdelka", sort: 5 }),
  make("finishing_ceilings", "pokraska",          "Покраска потолка",                { unit: "м²", from: 800,  slug: "chistovaya-otdelka", sort: 6 }),
];

// ── 23. ОТДЕЛОЧНЫЕ РАБОТЫ — ДВЕРИ (4) ─────────────────────────────────────
const FINISHING_DOORS: PriceItem[] = [
  make("finishing_doors", "standart",        "Монтаж стандартной межкомнатной двери", { unit: "шт.", from: 7500,  slug: "chistovaya-otdelka", sort: 1 }),
  make("finishing_doors", "skrytyy-montazh", "Монтаж двери скрытого монтажа",         { unit: "шт.", from: 15000, slug: "chistovaya-otdelka", sort: 2 }),
  make("finishing_doors", "vkhodnaya",       "Монтаж входной двери",                  { unit: "шт.", from: 12000, slug: "chistovaya-otdelka", sort: 3 }),
  make("finishing_doors", "portal",          "Монтаж портала",                        { unit: "комплект", from: 10000, slug: "chistovaya-otdelka", sort: 4 }),
];

// ── 24. ДЕМОНТАЖНЫЕ РАБОТЫ (14) ───────────────────────────────────────────
const DEMOLITION: PriceItem[] = [
  make("demolition", "kompleksnyy",          "Комплексный демонтаж квартиры",        { unit: "м²", unitLabel: "м² пола", from: 1500, sort: 1 }),
  make("demolition", "peregorodka-blok",     "Демонтаж перегородки из блока",        { unit: "м²", from: 900, sort: 2 }),
  make("demolition", "peregorodka-kirpich",  "Демонтаж кирпичной перегородки",       { unit: "м²", from: 1500, sort: 3 }),
  make("demolition", "shtukaturka",          "Демонтаж штукатурки",                  { unit: "м²", from: 500, sort: 4 }),
  make("demolition", "plitka",               "Демонтаж плитки",                      { unit: "м²", from: 500, sort: 5 }),
  make("demolition", "styazhka",             "Демонтаж стяжки",                      { unit: "м²", from: 800, sort: 6 }),
  make("demolition", "laminat",              "Демонтаж ламината",                    { unit: "м²", from: 250, sort: 7 }),
  make("demolition", "parquet",              "Демонтаж паркета",                     { unit: "м²", from: 500, sort: 8 }),
  make("demolition", "potolok-gkl",          "Демонтаж потолка ГКЛ",                 { unit: "м²", from: 500, sort: 9 }),
  make("demolition", "santekhnika",          "Демонтаж сантехники",                  { unit: "шт.", from: 1500, sort: 10 }),
  make("demolition", "elektroprovodka",      "Демонтаж электропроводки",             { unit: "м²", unitLabel: "м² пола", from: 500, sort: 11 }),
  make("demolition", "sbor-musora",          "Сбор строительного мусора",            { unit: "м²", unitLabel: "м² пола", from: 500, sort: 12 }),
  make("demolition", "pogruzka",             "Погрузка мусора",                      { unit: "тонна", from: 3000, sort: 13 }),
  make("demolition", "vyvoz",                "Вывоз мусора",                         { unit: "контейнер", label: "Рассчитывается отдельно", mode: "individual", sort: 14 }),
];

// ── Сводный экспорт ──────────────────────────────────────────────────────
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
