/**
 * Каталог реализованных объектов для разделов "Наши работы".
 * Используется как fallback при пустой БД и для блоков на страницах услуг.
 */
import img_w01 from "@/assets/portfolio/generated/w01.jpg";
import img_w02 from "@/assets/portfolio/generated/w02.jpg";
import img_w03 from "@/assets/portfolio/generated/w03.jpg";
import img_w04 from "@/assets/portfolio/generated/w04.jpg";
import img_w05 from "@/assets/portfolio/generated/w05.jpg";
import img_w06 from "@/assets/portfolio/generated/w06.jpg";
import img_w07 from "@/assets/portfolio/generated/w07.jpg";
import img_w08 from "@/assets/portfolio/generated/w08.jpg";

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
  // ——— Штукатурка и стяжка ———
  { id: "p01", category: "repair", tag: "Механизированная штукатурка", title: "Штукатурка стен квартиры под покраску, 78 м²", location: "Москва, ЖК «Символ»", area: "212 м² стен", year: 2026, image: img_w01 },
  { id: "p02", category: "repair", tag: "Механизированная штукатурка", title: "Штукатурка по маякам с выведением откосов, 96 м²", location: "Мытищи", area: "265 м² стен", year: 2026, image: img_w02 },
  { id: "p03", category: "repair", tag: "Мокрая стяжка пола", title: "Цементно-песчаная стяжка 60 мм по всей квартире, 92 м²", location: "Москва, ЗАО", area: "92 м²", year: 2026, image: img_w03 },
  { id: "p04", category: "repair", tag: "Мокрая стяжка пола", title: "Стяжка с шумоизоляцией и демпферной лентой, 64 м²", location: "Химки", area: "64 м²", year: 2025, image: img_w04 },
  { id: "p05", category: "repair", tag: "Комплекс черновых работ", title: "Штукатурка и стяжка в квартире свободной планировки, 110 м²", location: "Москва, ЖК «Остров»", area: "110 м²", year: 2025, image: img_w08 },
  { id: "p06", category: "repair", tag: "Механизированная штукатурка", title: "Штукатурка стен в частном доме, 186 м²", location: "Одинцовский округ", area: "410 м² стен", year: 2025, image: img_w01 },
  { id: "p07", category: "repair", tag: "Мокрая стяжка пола", title: "Стяжка пола в доме с перепадом 70 мм, 148 м²", location: "Пушкинский округ", area: "148 м²", year: 2025, image: img_w03 },

  // ——— Черновая инженерия и тёплый пол ———
  { id: "p08", category: "engineering", tag: "Тёплый пол", title: "Водяной тёплый пол с коллектором и стяжкой, 92 м²", location: "Москва", area: "92 м²", year: 2026, image: img_w05 },
  { id: "p09", category: "engineering", tag: "Тёплый пол", title: "Тёплый пол по всей площади дома, шаг 150 мм, 168 м²", location: "Красногорск", area: "168 м²", year: 2025, image: img_w05 },
  { id: "p10", category: "engineering", tag: "Черновая электрика", title: "Черновая электрика: штробы, кабель, щит на 36 модулей", location: "Москва, СВАО", area: "72 м²", year: 2026, image: img_w06 },
  { id: "p11", category: "engineering", tag: "Черновая электрика", title: "Разводка электрики в доме 180 м² с трёхфазным вводом", location: "Домодедово", area: "180 м²", year: 2025, image: img_w06 },
  { id: "p12", category: "engineering", tag: "Черновая сантехника", title: "Черновая разводка воды и канализации с опрессовкой", location: "Мытищи", area: "84 м²", year: 2026, image: img_w07 },
  { id: "p13", category: "engineering", tag: "Черновая сантехника", title: "Разводка сантехники на два санузла, коллекторная схема", location: "Балашиха", area: "96 м²", year: 2025, image: img_w07 },
];
