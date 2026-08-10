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

export const NAV_USLUGI: NavDropdown = {
  label: "Услуги",
  to: "/prices",
  description: "Штукатурка, стяжка, тёплый пол, электрика и сантехника — с прозрачным прайсом",
  items: [
    { label: "Механизированная штукатурка", to: "/mekhanizirovannaya-shtukaturka" },
    { label: "Мокрая стяжка пола", to: "/styazhka-pola" },
    { label: "Полусухая стяжка пола", to: "/polusuhaya-styazhka" },
    { label: "Тёплый пол", to: "/teplyy-pol" },
    { label: "Разводка электрики", to: "/razvodka-elektriki" },
    { label: "Разводка сантехники", to: "/razvodka-santehniki" },
  ],
};

export const MAIN_NAV: NavItem[] = [
  NAV_USLUGI,
  { label: "Цены", to: "/prices" },
  { label: "Калькулятор", to: "/kalkulyator-stoimosti" },
  { label: "Наши работы", to: "/portfolio" },
  { label: "О компании", to: "/about" },
  { label: "Контакты", to: "/contacts" },
];

export const FOOTER_INFO_LINKS: NavLink[] = [
  { label: "О компании", to: "/about" },
  { label: "Как мы работаем", to: "/how-we-work" },
  { label: "Контроль качества", to: "/kontrol-kachestva" },
  { label: "Наши работы", to: "/portfolio" },
  { label: "Отзывы", to: "/reviews" },
  { label: "Вопросы и ответы", to: "/faq" },
];

export const FOOTER_LEGAL_LINKS: NavLink[] = [
  { label: "Политика конфиденциальности", to: "/privacy" },
  { label: "Согласие на обработку ПД", to: "/personal-data-consent" },
  { label: "Политика cookies", to: "/cookies" },
  { label: "Пользовательское соглашение", to: "/terms" },
];