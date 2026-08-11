/**
 * Каталог реализованных объектов для разделов "Наши работы".
 * Используется как fallback при пустой БД и для блоков на страницах услуг.
 */

import wf01 from "@/assets/photos/warmfloor/wf01.jpg.asset.json";
import wf02 from "@/assets/photos/warmfloor/wf02.jpg.asset.json";
import wf03 from "@/assets/photos/warmfloor/wf03.jpg.asset.json";
import wf04 from "@/assets/photos/warmfloor/wf04.jpg.asset.json";
import wf05 from "@/assets/photos/warmfloor/wf05.jpg.asset.json";
import wf06 from "@/assets/photos/warmfloor/wf06.jpg.asset.json";
import wf07 from "@/assets/photos/warmfloor/wf07.jpg.asset.json";
import wf08 from "@/assets/photos/warmfloor/wf08.jpg.asset.json";

import el01 from "@/assets/photos/electric/el01.jpg.asset.json";
import el02 from "@/assets/photos/electric/el02.jpg.asset.json";
import el03 from "@/assets/photos/electric/el03.jpg.asset.json";
import el04 from "@/assets/photos/electric/el04.jpg.asset.json";
import el05 from "@/assets/photos/electric/el05.jpg.asset.json";
import el06 from "@/assets/photos/electric/el06.jpg.asset.json";
import el07 from "@/assets/photos/electric/el07.jpg.asset.json";

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
  // ——— Тёплый пол (реальные объекты) ———
  { id: "p08", category: "engineering", tag: "Тёплый пол", title: "Водяной тёплый пол с коллектором и стяжкой, 92 м²", location: "Москва", area: "92 м²", year: 2026, image: wf01.url },
  { id: "p09", category: "engineering", tag: "Тёплый пол", title: "Тёплый пол по всей площади дома, шаг 150 мм, 168 м²", location: "Красногорск", area: "168 м²", year: 2025, image: wf02.url },
  { id: "p14", category: "engineering", tag: "Тёплый пол", title: "Тёплый пол по матам с бобышками, два коллекторных узла, 145 м²", location: "Одинцово", area: "145 м²", year: 2026, image: wf03.url },
  { id: "p15", category: "engineering", tag: "Тёплый пол", title: "Два коллектора на 20 контуров, разводка по этажу, 210 м²", location: "Москва, ТиНАО", area: "210 м²", year: 2025, image: wf04.url },
  { id: "p16", category: "engineering", tag: "Тёплый пол", title: "Тёплый пол в санузле и кухне по пенополистирольным матам, 34 м²", location: "Королёв", area: "34 м²", year: 2026, image: wf05.url },
  { id: "p17", category: "engineering", tag: "Тёплый пол", title: "Контуры по армирующей сетке под мокрую стяжку, 88 м²", location: "Люберцы", area: "88 м²", year: 2025, image: wf06.url },
  { id: "p18", category: "engineering", tag: "Тёплый пол", title: "Заливка стяжки поверх готовых контуров тёплого пола, 76 м²", location: "Подольск", area: "76 м²", year: 2025, image: wf07.url },
  { id: "p19", category: "engineering", tag: "Тёплый пол", title: "Раскладка контуров улиткой с шагом 150 мм, 62 м²", location: "Москва, ЮЗАО", area: "62 м²", year: 2026, image: wf08.url },

  // ——— Черновая электрика (реальные объекты) ———
  { id: "e01", category: "engineering", tag: "Черновая электрика", title: "Сборка квартирного щита с реле напряжения и УЗО, 24 модуля", location: "Москва, СВАО", area: "72 м²", year: 2026, image: el01.url },
  { id: "e02", category: "engineering", tag: "Черновая электрика", title: "Щит на 4 ряда: вводной автомат 63А, УЗО 40А, группы освещения и розеток", location: "Москва", area: "112 м²", year: 2026, image: el02.url },
  { id: "e03", category: "engineering", tag: "Черновая электрика", title: "Разводка кабельных трасс по полу от щита, гофра и крепёж", location: "Красногорск", area: "86 м²", year: 2025, image: el03.url },
  { id: "e04", category: "электрика" as never, tag: "Черновая электрика", title: "Трассы по потолку в гофре с креплением каждые 30 см", location: "Мытищи", area: "64 м²", year: 2025, image: el04.url },
  { id: "e05", category: "engineering", tag: "Черновая электрика", title: "Штробление газоблока под кабель и подрозетники", location: "Одинцовский округ", area: "96 м²", year: 2025, image: el05.url },
  { id: "e06", category: "engineering", tag: "Черновая электрика", title: "Разводка под розеточные группы с выводами в подрозетники", location: "Люберцы", area: "78 м²", year: 2026, image: el06.url },
  { id: "e07", category: "engineering", tag: "Черновая электрика", title: "Электрика в каркасном доме: трассы по перекрытию и распредкоробки", location: "Пушкинский округ", area: "134 м²", year: 2025, image: el07.url },
];

export function getShowcaseByCategory(category: ServiceCategory, limit = 6): ShowcaseProject[] {
  return SHOWCASE_PROJECTS.filter((p) => p.category === category).slice(0, limit);
}
