/**
 * Полный список URL §11 ТЗ. Источник истины для меню, футера,
 * sitemap (Этап 6) и автогенерации заглушек.
 */
export interface RouteEntry {
  path: string;
  title: string;
  shortTitle?: string;
  group:
    | "stroitelstvo"
    | "remont"
    | "inzhenernye"
    | "info"
    | "client"
    | "legal"
    | "root";
  stub?: boolean;
}

export const ROUTES: RouteEntry[] = [
  { path: "/", title: "Главная", group: "root" },

  // Строительство
  { path: "/stroitelstvo", title: "Строительство", group: "stroitelstvo", stub: true },
  { path: "/stroitelstvo-domov-pod-klyuch", title: "Строительство частных домов под ключ", shortTitle: "Дома под ключ", group: "stroitelstvo", stub: true },
  { path: "/karkasnye-doma", title: "Каркасные дома", group: "stroitelstvo", stub: true },
  { path: "/doma-iz-sip-paneley", title: "Дома из СИП-панелей", group: "stroitelstvo", stub: true },
  { path: "/doma-iz-brusa", title: "Дома из профилированного бруса", shortTitle: "Дома из бруса", group: "stroitelstvo", stub: true },
  { path: "/doma-iz-kleenogo-brusa", title: "Дома из клееного бруса", group: "stroitelstvo", stub: true },
  { path: "/doma-iz-gazobetona", title: "Дома из газобетона", group: "stroitelstvo", stub: true },
  { path: "/doma-iz-keramicheskih-blokov", title: "Дома из керамических блоков", group: "stroitelstvo", stub: true },
  { path: "/kirpichnye-doma", title: "Кирпичные дома", group: "stroitelstvo", stub: true },
  { path: "/monolitnye-doma", title: "Монолитные дома", group: "stroitelstvo", stub: true },
  { path: "/kombinirovannye-doma", title: "Комбинированные дома", group: "stroitelstvo", stub: true },
  { path: "/mnogokvartirnye-doma", title: "Многоквартирные дома", group: "stroitelstvo", stub: true },
  { path: "/generalnyy-podryad", title: "Генеральный подряд", group: "stroitelstvo", stub: true },
  { path: "/monolitnye-raboty", title: "Монолитные работы", group: "stroitelstvo", stub: true },
  { path: "/fundamenty", title: "Фундаменты", group: "stroitelstvo", stub: true },
  { path: "/kladochnye-raboty", title: "Кладочные работы", group: "stroitelstvo", stub: true },
  { path: "/krovelnye-raboty", title: "Кровельные работы", group: "stroitelstvo", stub: true },
  { path: "/fasadnye-raboty", title: "Фасадные работы", group: "stroitelstvo", stub: true },

  // Ремонт
  { path: "/remont", title: "Ремонт", group: "remont", stub: true },
  { path: "/remont-pod-klyuch", title: "Ремонт под ключ", group: "remont", stub: true },
  { path: "/kosmeticheskiy-remont", title: "Косметический ремонт", group: "remont", stub: true },
  { path: "/ekonom-remont", title: "Эконом-ремонт", group: "remont", stub: true },
  { path: "/standartnyy-remont", title: "Стандартный ремонт", group: "remont", stub: true },
  { path: "/evroremont", title: "Евроремонт", group: "remont", stub: true },
  { path: "/biznes-remont", title: "Бизнес-ремонт", group: "remont", stub: true },
  { path: "/premialnyy-remont", title: "Премиальный ремонт", group: "remont", stub: true },
  { path: "/chernovoy-remont", title: "Черновой ремонт", group: "remont", stub: true },
  { path: "/chistovaya-otdelka", title: "Чистовая отделка", group: "remont", stub: true },

  // Инженерные системы
  { path: "/inzhenernye-sistemy", title: "Инженерные системы", group: "inzhenernye", stub: true },
  { path: "/elektromontazh", title: "Электромонтаж", group: "inzhenernye", stub: true },
  { path: "/santehnika", title: "Сантехника", group: "inzhenernye", stub: true },
  { path: "/vodosnabzhenie-kanalizatsiya", title: "Водоснабжение и канализация", group: "inzhenernye", stub: true },
  { path: "/otoplenie", title: "Отопление", group: "inzhenernye", stub: true },
  { path: "/teplyy-pol", title: "Тёплый пол", group: "inzhenernye", stub: true },
  { path: "/ukladka-plitki", title: "Укладка плитки", group: "inzhenernye", stub: true },

  // Информационные
  { path: "/portfolio", title: "Наши работы", group: "info", stub: true },
  { path: "/prices", title: "Цены", group: "info", stub: true },
  { path: "/about", title: "О компании", group: "info", stub: true },
  { path: "/team", title: "Команда", group: "info", stub: true },
  { path: "/sro-i-dokumenty", title: "СРО и документы", group: "info", stub: true },
  { path: "/kontrol-kachestva", title: "Контроль качества", group: "info", stub: true },
  { path: "/how-we-work", title: "Как мы работаем", group: "info", stub: true },
  { path: "/reviews", title: "Отзывы", group: "info", stub: true },
  { path: "/contacts", title: "Контакты", group: "info", stub: true },
  { path: "/faq", title: "Вопросы и ответы", group: "info", stub: true },

  // Клиентская часть (на Этапе 1 — публичные заглушки)
  { path: "/login", title: "Вход в личный кабинет", shortTitle: "Личный кабинет", group: "client", stub: true },
  { path: "/client", title: "Личный кабинет", group: "client", stub: true },
  { path: "/admin", title: "Административная панель", group: "client", stub: true },

  // Калькулятор (Подэтап 2.5.3)
  { path: "/kalkulyator-stoimosti", title: "Калькулятор предварительной стоимости работ", shortTitle: "Калькулятор", group: "info" },

  // Юридические
  { path: "/privacy", title: "Политика конфиденциальности", group: "legal", stub: true },
  { path: "/personal-data-consent", title: "Согласие на обработку персональных данных", shortTitle: "Согласие на ОПД", group: "legal", stub: true },
  { path: "/cookies", title: "Политика использования cookies", shortTitle: "Cookies", group: "legal", stub: true },
  { path: "/terms", title: "Пользовательское соглашение", group: "legal", stub: true },
  { path: "/requisites", title: "Реквизиты", group: "legal", stub: true },
];

export function findRoute(path: string): RouteEntry | undefined {
  return ROUTES.find((r) => r.path === path);
}