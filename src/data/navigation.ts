/**
 * Главное меню §10 ТЗ. Единственный источник для desktop и mobile
 * навигации — дублирование запрещено.
 */
export interface NavLink {
  label: string;
  to: string;
}

export interface NavDropdown {
  label: string;
  to: string;
  description?: string;
  items: NavLink[];
}

export type NavItem = NavLink | NavDropdown;

export function isDropdown(item: NavItem): item is NavDropdown {
  return "items" in item && Array.isArray((item as NavDropdown).items);
}

export const NAV_STROITELSTVO: NavDropdown = {
  label: "Строительство",
  to: "/stroitelstvo",
  description: "Частные и многоквартирные дома, генподряд, монолит, кладка, кровля, фасады",
  items: [
    { label: "Частные дома под ключ", to: "/stroitelstvo-domov-pod-klyuch" },
    { label: "Многоквартирные дома", to: "/mnogokvartirnye-doma" },
    { label: "Генеральный подряд", to: "/generalnyy-podryad" },
    { label: "Монолитные работы", to: "/monolitnye-raboty" },
    { label: "Фундаменты", to: "/fundamenty" },
    { label: "Кладочные работы", to: "/kladochnye-raboty" },
    { label: "Кровельные работы", to: "/krovelnye-raboty" },
    { label: "Фасадные работы", to: "/fasadnye-raboty" },
  ],
};

export const NAV_REMONT: NavDropdown = {
  label: "Ремонт",
  to: "/remont",
  description: "Косметический, эконом, стандарт, евро, бизнес, премиум и эксклюзивные пакеты",
  items: [
    { label: "Ремонт под ключ", to: "/remont-pod-klyuch" },
    { label: "Косметический ремонт", to: "/kosmeticheskiy-remont" },
    { label: "Эконом-ремонт", to: "/ekonom-remont" },
    { label: "Стандартный ремонт", to: "/standartnyy-remont" },
    { label: "Евроремонт", to: "/evroremont" },
    { label: "Бизнес-ремонт", to: "/biznes-remont" },
    { label: "Премиальный ремонт", to: "/premialnyy-remont" },
    { label: "Черновой ремонт", to: "/chernovoy-remont" },
    { label: "Чистовая отделка", to: "/chistovaya-otdelka" },
  ],
};

export const NAV_INZHENERNYE: NavDropdown = {
  label: "Инженерные системы",
  to: "/inzhenernye-sistemy",
  description: "Электромонтаж, сантехника, водоснабжение, отопление, тёплый пол, плитка",
  items: [
    { label: "Электромонтаж", to: "/elektromontazh" },
    { label: "Сантехника", to: "/santehnika" },
    { label: "Водоснабжение и канализация", to: "/vodosnabzhenie-kanalizatsiya" },
    { label: "Отопление", to: "/otoplenie" },
    { label: "Тёплый пол", to: "/teplyy-pol" },
    { label: "Плиточные работы", to: "/ukladka-plitki" },
  ],
};

export const MAIN_NAV: NavItem[] = [
  NAV_STROITELSTVO,
  NAV_REMONT,
  NAV_INZHENERNYE,
  { label: "Проекты домов", to: "/proekty" },
  { label: "Наши работы", to: "/portfolio" },
  { label: "Цены", to: "/prices" },
  { label: "О компании", to: "/about" },
  { label: "Контакты", to: "/contacts" },
];

export const FOOTER_INFO_LINKS: NavLink[] = [
  { label: "О компании", to: "/about" },
  { label: "Команда", to: "/team" },
  { label: "Как мы работаем", to: "/how-we-work" },
  { label: "Контроль качества", to: "/kontrol-kachestva" },
  { label: "СРО и документы", to: "/sro-i-dokumenty" },
  { label: "Наши работы", to: "/portfolio" },
  { label: "Отзывы", to: "/reviews" },
  { label: "Вопросы и ответы", to: "/faq" },
];

export const FOOTER_LEGAL_LINKS: NavLink[] = [
  { label: "Политика конфиденциальности", to: "/privacy" },
  { label: "Согласие на обработку ПД", to: "/personal-data-consent" },
  { label: "Политика cookies", to: "/cookies" },
  { label: "Пользовательское соглашение", to: "/terms" },
  { label: "Реквизиты", to: "/requisites" },
];