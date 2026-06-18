/**
 * §12.3 ТЗ — шесть стартовых цен на главной. Значения дословные,
 * редактировать запрещено (уточнение 5 пользователя).
 */
export interface StartingPrice {
  service: string;
  price: string;
  to: string;
}

export const HOME_STARTING_PRICES: StartingPrice[] = [
  { service: "Ремонт квартиры", price: "от 12 000 ₽/м² за работы", to: "/remont-pod-klyuch" },
  { service: "Дом из газобетона под ключ", price: "работы от 65 000 ₽/м²", to: "/doma-iz-gazobetona" },
  { service: "Каркасный дом под ключ", price: "работы от 45 000 ₽/м²", to: "/karkasnye-doma" },
  { service: "Монолитные работы", price: "от 18 000 ₽/м³", to: "/monolitnye-raboty" },
  { service: "Электромонтаж под ключ", price: "от 2 500 ₽/м²", to: "/elektromontazh" },
  { service: "Укладка плитки", price: "от 2 800 ₽/м²", to: "/ukladka-plitki" },
];

/** Дата актуализации цен на главной. */
export const PRICES_ACTUAL_DATE = "Июнь 2026 года";