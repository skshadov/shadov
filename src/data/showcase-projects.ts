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
];

export function getShowcaseByCategory(category: ServiceCategory, limit = 6): ShowcaseProject[] {
  return SHOWCASE_PROJECTS.filter((p) => p.category === category).slice(0, limit);
}
