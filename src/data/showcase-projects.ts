/**
 * Каталог реализованных объектов для разделов "Наши работы".
 * Используется как fallback при пустой БД и для блоков на страницах услуг.
 */
import img_c01 from "@/assets/portfolio/generated/c01.jpg";
import img_c02 from "@/assets/portfolio/generated/c02.jpg";
import img_c03 from "@/assets/portfolio/generated/c03.jpg";
import img_c04 from "@/assets/portfolio/generated/c04.jpg";
import img_c05 from "@/assets/portfolio/generated/c05.jpg";
import img_c06 from "@/assets/portfolio/generated/c06.jpg";
import img_c07 from "@/assets/portfolio/generated/c07.jpg";
import img_c08 from "@/assets/portfolio/generated/c08.jpg";
import img_c09 from "@/assets/portfolio/generated/c09.jpg";
import img_c10 from "@/assets/portfolio/generated/c10.jpg";
import img_c11 from "@/assets/portfolio/generated/c11.jpg";
import img_c12 from "@/assets/portfolio/generated/c12.jpg";
import img_c13 from "@/assets/portfolio/generated/c13.jpg";
import img_c14 from "@/assets/portfolio/generated/c14.jpg";
import img_c15 from "@/assets/portfolio/generated/c15.jpg";
import img_r01 from "@/assets/portfolio/generated/r01.jpg";
import img_r02 from "@/assets/portfolio/generated/r02.jpg";
import img_r03 from "@/assets/portfolio/generated/r03.jpg";
import img_r04 from "@/assets/portfolio/generated/r04.jpg";
import img_r05 from "@/assets/portfolio/generated/r05.jpg";
import img_r06 from "@/assets/portfolio/generated/r06.jpg";
import img_r07 from "@/assets/portfolio/generated/r07.jpg";
import img_r08 from "@/assets/portfolio/generated/r08.jpg";
import img_r09 from "@/assets/portfolio/generated/r09.jpg";
import img_r10 from "@/assets/portfolio/generated/r10.jpg";
import img_r11 from "@/assets/portfolio/generated/r11.jpg";
import img_r12 from "@/assets/portfolio/generated/r12.jpg";
import img_r13 from "@/assets/portfolio/generated/r13.jpg";
import img_e01 from "@/assets/portfolio/generated/e01.jpg";
import img_e02 from "@/assets/portfolio/generated/e02.jpg";
import img_e03 from "@/assets/portfolio/generated/e03.jpg";
import img_e04 from "@/assets/portfolio/generated/e04.jpg";
import img_e05 from "@/assets/portfolio/generated/e05.jpg";
import img_e06 from "@/assets/portfolio/generated/e06.jpg";
import img_e07 from "@/assets/portfolio/generated/e07.jpg";
import img_e08 from "@/assets/portfolio/generated/e08.jpg";
import img_e09 from "@/assets/portfolio/generated/e09.jpg";
import img_e10 from "@/assets/portfolio/generated/e10.jpg";

import type { ServiceCategory } from "@/types/services";

export type ShowcaseProject = {
  id: string;
  category: ServiceCategory;
  tag: string;
  title: string;
  location: string;
  area: string;
  year: number;
  image: string;
};


export const SHOWCASE_PROJECTS: ShowcaseProject[] = [
  // ——— Строительство домов ———
  { id: "c01", category: "construction", tag: "Кирпичный дом", title: "Двухэтажный кирпичный дом с панорамным остеклением, 320 м²", location: "Мытищинский район, КП «Сосновый бор»", area: "320 м²", year: 2025, image: img_c01 },
  { id: "c02", category: "construction", tag: "Дом из газобетона", title: "Дом из газобетона с облицовкой клинкером, 240 м²", location: "Пушкинский район, д. Талицы", area: "240 м²", year: 2025, image: img_c02 },
  { id: "c03", category: "construction", tag: "Каркасный дом", title: "Каркасный дом с панорамными окнами в сосновом лесу, 180 м²", location: "Дмитровский район, КП «Лесная сказка»", area: "180 м²", year: 2024, image: img_c03 },
  { id: "c04", category: "construction", tag: "Монолитный дом", title: "Монолитный коттедж с эксплуатируемой кровлей, 410 м²", location: "Одинцовский район, КП «Новое Лапино»", area: "410 м²", year: 2024, image: img_c04 },
  { id: "c05", category: "construction", tag: "Дом из бруса", title: "Дом из клеёного бруса с террасой и сауной, 210 м²", location: "Сергиево-Посадский район, д. Шильцы", area: "210 м²", year: 2024, image: img_c05 },
  { id: "c06", category: "construction", tag: "Кирпичный дом", title: "Загородный дом из лицевого кирпича с гаражом, 290 м²", location: "Ленинский район, г. Видное", area: "290 м²", year: 2024, image: img_c06 },
  { id: "c07", category: "construction", tag: "Таунхаус", title: "Монолитный таунхаус-комплекс на 6 секций", location: "г. Мытищи, ул. Стрелковая", area: "1 280 м²", year: 2023, image: img_c07 },
  { id: "c08", category: "construction", tag: "Дом из газобетона", title: "Одноэтажный дом из газобетона с плоской кровлей, 165 м²", location: "Раменский район, КП «Малая Истра»", area: "165 м²", year: 2023, image: img_c08 },
  { id: "c09", category: "construction", tag: "SIP-дом", title: "SIP-дом под ключ с отделкой фиброцементными панелями, 145 м²", location: "Чеховский район, д. Манушкино", area: "145 м²", year: 2023, image: img_c09 },
  { id: "c10", category: "construction", tag: "Кирпичный дом", title: "Трёхэтажный кирпичный особняк с цокольным этажом, 520 м²", location: "Красногорский район, КП «Барвиха-Хиллс»", area: "520 м²", year: 2023, image: img_c10 },
  { id: "c11", category: "construction", tag: "Дом из керамоблоков", title: "Дом из керамических блоков с фасадом из натурального камня, 270 м²", location: "Истринский район, КП «Княжье озеро»", area: "270 м²", year: 2022, image: img_c11 },
  { id: "c12", category: "construction", tag: "Каркасный дом", title: "Каркасный дом с фахверковыми элементами фасада, 195 м²", location: "Солнечногорский район, д. Берсеневка", area: "195 м²", year: 2022, image: img_c12 },
  { id: "c13", category: "construction", tag: "Фундамент", title: "Утеплённая шведская плита под коттедж 240 м²", location: "Подольский район, КП «Никитское»", area: "248 м²", year: 2025, image: img_c13 },
  { id: "c14", category: "construction", tag: "Кровля", title: "Многощипцовая кровля из натуральной черепицы, 380 м²", location: "Рузский район, КП «Никольские озёра»", area: "380 м²", year: 2024, image: img_c14 },
  { id: "c15", category: "construction", tag: "Фасад", title: "Вентилируемый фасад из клинкерной плитки, 410 м²", location: "г. Королёв, ул. Циолковского", area: "410 м²", year: 2024, image: img_c15 },

  // ——— Ремонт квартир ———
  { id: "r01", category: "repair", tag: "Премиальный ремонт", title: "Премиальный ремонт квартиры в стиле минимализм, 142 м²", location: "Москва, ЖК «Садовые кварталы»", area: "142 м²", year: 2025, image: img_r01 },
  { id: "r02", category: "repair", tag: "Евроремонт", title: "Евроремонт двухкомнатной квартиры с перепланировкой, 68 м²", location: "Москва, ЖК «Символ»", area: "68 м²", year: 2025, image: img_r02 },
  { id: "r03", category: "repair", tag: "Ремонт под ключ", title: "Ремонт трёхкомнатной квартиры под ключ, 96 м²", location: "г. Мытищи, ЖК «Ярославский»", area: "96 м²", year: 2025, image: img_r03 },
  { id: "r04", category: "repair", tag: "Санузел", title: "Совмещённый санузел с крупноформатной плиткой, 7 м²", location: "Москва, ЖК «ЗИЛАРТ»", area: "7 м²", year: 2025, image: img_r04 },
  { id: "r05", category: "repair", tag: "Стандартный ремонт", title: "Стандартный ремонт однокомнатной квартиры, 42 м²", location: "г. Королёв, ЖК «Валентиновка Парк»", area: "42 м²", year: 2024, image: img_r05 },
  { id: "r06", category: "repair", tag: "Чистовая отделка", title: "Чистовая отделка квартиры от застройщика, 78 м²", location: "г. Долгопрудный, ЖК «Северный»", area: "78 м²", year: 2024, image: img_r06 },
  { id: "r07", category: "repair", tag: "Премиальный ремонт", title: "Дизайнерский ремонт пентхауса с панорамным остеклением, 210 м²", location: "Москва, ЖК «Дом на Мосфильмовской»", area: "210 м²", year: 2024, image: img_r07 },
  { id: "r08", category: "repair", tag: "Чистовая отделка", title: "Чистовая отделка квартиры в скандинавском стиле, 64 м²", location: "г. Балашиха, ЖК «Алексеевская роща»", area: "64 м²", year: 2024, image: img_r08 },
  { id: "r09", category: "repair", tag: "Бизнес-ремонт", title: "Ремонт коммерческого офиса open-space, 320 м²", location: "Москва, БЦ «Алкон»", area: "320 м²", year: 2024, image: img_r09 },
  { id: "r10", category: "repair", tag: "Чистовая отделка", title: "Укладка крупноформатного керамогранита 1200×600 мм, 96 м²", location: "Москва, ЖК «Headliner»", area: "96 м²", year: 2023, image: img_r10 },
  { id: "r11", category: "repair", tag: "Косметический ремонт", title: "Косметический ремонт двухкомнатной квартиры за 21 день, 54 м²", location: "г. Мытищи, мкр. Перловский", area: "54 м²", year: 2023, image: img_r11 },
  { id: "r12", category: "repair", tag: "Эконом-ремонт", title: "Эконом-ремонт квартиры в новостройке, 36 м²", location: "г. Реутов, ЖК «Новокосино-2»", area: "36 м²", year: 2023, image: img_r12 },
  { id: "r13", category: "repair", tag: "Черновой ремонт", title: "Черновые работы в квартире 110 м² с перепланировкой", location: "Москва, ЖК «Лица»", area: "110 м²", year: 2023, image: img_r13 },

  // ——— Инженерные системы ———
  { id: "e01", category: "engineering", tag: "Котельная", title: "Газовая котельная с бойлером косвенного нагрева для дома 280 м²", location: "Мытищинский район, КП «Сосновый бор»", area: "—", year: 2025, image: img_e01 },
  { id: "e02", category: "engineering", tag: "Водоподготовка", title: "Система водоподготовки с обратным осмосом и УФ-фильтрацией", location: "Дмитровский район, КП «Лесная сказка»", area: "—", year: 2025, image: img_e02 },
  { id: "e03", category: "engineering", tag: "Тёплый пол", title: "Водяной тёплый пол по всей площади коттеджа, 240 м²", location: "Пушкинский район, д. Талицы", area: "240 м²", year: 2025, image: img_e03 },
  { id: "e04", category: "engineering", tag: "Электромонтаж", title: "Электромонтаж дома с резервным генератором, 320 м²", location: "Одинцовский район, КП «Новое Лапино»", area: "320 м²", year: 2024, image: img_e04 },
  { id: "e05", category: "engineering", tag: "Отопление", title: "Радиаторное отопление двух контуров с погодозависимой автоматикой", location: "Сергиево-Посадский район, д. Шильцы", area: "210 м²", year: 2024, image: img_e05 },
  { id: "e06", category: "engineering", tag: "Сантехника", title: "Полный комплект сантехники для 4 санузлов с скрытыми инсталляциями", location: "Москва, ЖК «Садовые кварталы»", area: "—", year: 2024, image: img_e06 },
  { id: "e07", category: "engineering", tag: "Водоснабжение", title: "Скважина 65 м с кессоном и автоматикой подачи воды в дом", location: "Чеховский район, д. Манушкино", area: "—", year: 2023, image: img_e07 },
  { id: "e08", category: "engineering", tag: "Канализация", title: "Локальная канализация с септиком на 6 жителей", location: "Раменский район, КП «Малая Истра»", area: "—", year: 2023, image: img_e08 },
  { id: "e09", category: "engineering", tag: "Электромонтаж", title: "Электрощит на 3 фазы с УЗО по каждой группе, дом 165 м²", location: "г. Видное, ЖК «Бутово Парк»", area: "—", year: 2023, image: img_e09 },
  { id: "e10", category: "engineering", tag: "Тёплый пол", title: "Электрический тёплый пол в санузлах и на кухне квартиры, 22 м²", location: "Москва, ЖК «ЗИЛАРТ»", area: "22 м²", year: 2023, image: img_e10 },
];

export function getShowcaseByCategory(category: ServiceCategory, limit = 6): ShowcaseProject[] {
  return SHOWCASE_PROJECTS.filter((p) => p.category === category).slice(0, limit);
}