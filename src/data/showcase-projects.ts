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

import pl01 from "@/assets/photos/plumbing/pl01.jpg.asset.json";
import pl02 from "@/assets/photos/plumbing/pl02.jpg.asset.json";
import pl03 from "@/assets/photos/plumbing/pl03.jpg.asset.json";
import pl04 from "@/assets/photos/plumbing/pl04.jpg.asset.json";
import pl05 from "@/assets/photos/plumbing/pl05.jpg.asset.json";
import pl06 from "@/assets/photos/plumbing/pl06.jpg.asset.json";

import ph01 from "@/assets/photos/plaster/ph01.jpg.asset.json";
import ph02 from "@/assets/photos/plaster/ph02.jpg.asset.json";
import ph03 from "@/assets/photos/plaster/ph03.jpg.asset.json";
import ph04 from "@/assets/photos/plaster/ph04.jpg.asset.json";
import ph05 from "@/assets/photos/plaster/ph05.jpg.asset.json";
import ph06 from "@/assets/photos/plaster/ph06.jpg.asset.json";
import ph07 from "@/assets/photos/plaster/ph07.jpg.asset.json";
import ph08 from "@/assets/photos/plaster/ph08.jpg.asset.json";
import ph09 from "@/assets/photos/plaster/ph09.jpg.asset.json";
import ph10 from "@/assets/photos/plaster/ph10.jpg.asset.json";

import sc01 from "@/assets/photos/screed/sc01.jpg.asset.json";
import sc02 from "@/assets/photos/screed/sc02.jpg.asset.json";
import sc03 from "@/assets/photos/screed/sc03.jpg.asset.json";
import sc04 from "@/assets/photos/screed/sc04.jpg.asset.json";
import sc05 from "@/assets/photos/screed/sc05.jpg.asset.json";
import sc06 from "@/assets/photos/screed/sc06.jpg.asset.json";
import sc07 from "@/assets/photos/screed/sc07.jpg.asset.json";
import sc08 from "@/assets/photos/screed/sc08.jpg.asset.json";
import sc09 from "@/assets/photos/screed/sc09.jpg.asset.json";
import sc10 from "@/assets/photos/screed/sc10.jpg.asset.json";

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
  { id: "e04", category: "engineering", tag: "Черновая электрика", title: "Трассы по потолку в гофре с креплением каждые 30 см", location: "Мытищи", area: "64 м²", year: 2025, image: el04.url },
  { id: "e05", category: "engineering", tag: "Черновая электрика", title: "Штробление газоблока под кабель и подрозетники", location: "Одинцовский округ", area: "96 м²", year: 2025, image: el05.url },
  { id: "e06", category: "engineering", tag: "Черновая электрика", title: "Разводка под розеточные группы с выводами в подрозетники", location: "Люберцы", area: "78 м²", year: 2026, image: el06.url },
  { id: "e07", category: "engineering", tag: "Черновая электрика", title: "Электрика в каркасном доме: трассы по перекрытию и распредкоробки", location: "Пушкинский округ", area: "134 м²", year: 2025, image: el07.url },

  // ——— Черновая сантехника (реальные объекты) ———
  { id: "s01", category: "engineering", tag: "Черновая сантехника", title: "Коллекторный узел ХВС/ГВС на 12 линий с фильтрами и редукторами", location: "Москва, ЗАО", area: "104 м²", year: 2026, image: pl01.url },
  { id: "s02", category: "engineering", tag: "Черновая сантехника", title: "Санузел под ключ: коллекторы, счётчики и инсталляция Geberit", location: "Химки", area: "58 м²", year: 2026, image: pl02.url },
  { id: "s03", category: "engineering", tag: "Черновая сантехника", title: "Узел ввода в нише за стояками, разводка в теплоизоляции", location: "Москва, САО", area: "46 м²", year: 2025, image: pl03.url },
  { id: "s04", category: "engineering", tag: "Черновая сантехника", title: "Разводка канализации Ø50/110 с ревизией и выводами под приборы", location: "Балашиха", area: "68 м²", year: 2025, image: pl04.url },
  { id: "s05", category: "engineering", tag: "Черновая сантехника", title: "Коллекторная разводка и монтаж инсталляции Grohe в новостройке", location: "Москва, ТиНАО", area: "82 м²", year: 2026, image: pl05.url },
  { id: "s06", category: "engineering", tag: "Черновая сантехника", title: "Водорозетки в штробе и вывод канализации под подвесной унитаз", location: "Одинцово", area: "54 м²", year: 2025, image: pl06.url },

  // ——— Механизированная штукатурка (реальные объекты) ———
  { id: "m01", category: "repair", tag: "Механизированная штукатурка", title: "Штукатурка стен по маякам в новостройке, гипсовая смесь", location: "Москва, ЮАО", area: "68 м²", year: 2026, image: ph01.url },
  { id: "m02", category: "repair", tag: "Механизированная штукатурка", title: "Выравнивание стен под покраску, слой до 20 мм", location: "Химки", area: "54 м²", year: 2025, image: ph02.url },
  { id: "m03", category: "repair", tag: "Механизированная штукатурка", title: "Штукатурка станцией PFT в загородном доме", location: "Одинцовский округ", area: "180 м²", year: 2025, image: ph03.url },
  { id: "m04", category: "repair", tag: "Механизированная штукатурка", title: "Штукатурка всего этажа дома с откосами и углами", location: "Пушкинский округ", area: "240 м²", year: 2026, image: ph04.url },
  { id: "m05", category: "repair", tag: "Механизированная штукатурка", title: "Ниши и внутренние углы 90° под чистовую отделку", location: "Москва, ЗАО", area: "96 м²", year: 2026, image: ph05.url },
  { id: "m06", category: "repair", tag: "Механизированная штукатурка", title: "Ровные откосы и наружные углы в квартире-студии", location: "Красногорск", area: "42 м²", year: 2025, image: ph06.url },
  { id: "m07", category: "repair", tag: "Механизированная штукатурка", title: "Стены под обои, глянцевание поверхности", location: "Люберцы", area: "72 м²", year: 2025, image: ph07.url },
  { id: "m08", category: "repair", tag: "Механизированная штукатурка", title: "Контроль плоскости правилом 2 м: отклонение до 1 мм", location: "Москва, СЗАО", area: "88 м²", year: 2026, image: ph08.url },
  { id: "m09", category: "repair", tag: "Механизированная штукатурка", title: "Приёмка стен по правилу после механизированной штукатурки", location: "Мытищи", area: "64 м²", year: 2026, image: ph09.url },
  { id: "m10", category: "repair", tag: "Механизированная штукатурка", title: "Штукатурка стен в новостройке по газоблоку и бетону", location: "Балашиха", area: "58 м²", year: 2025, image: ph10.url },

  // ——— Стяжка пола (реальные объекты) ———
  { id: "t01", category: "repair", tag: "Стяжка пола", title: "Мокрая стяжка поверх тёплого пола по армосетке, слой 70 мм", location: "Москва, ТиНАО", area: "62 м²", year: 2026, image: sc01.url },
  { id: "t02", category: "repair", tag: "Стяжка пола", title: "Плавающая стяжка по демпферной ленте в кирпичном доме", location: "Одинцовский округ", area: "110 м²", year: 2025, image: sc02.url },
  { id: "t03", category: "repair", tag: "Стяжка пола", title: "Заливка по контурам тёплого пола с выходом на ноль у окна", location: "Красногорск", area: "48 м²", year: 2026, image: sc03.url },
  { id: "t04", category: "repair", tag: "Стяжка пола", title: "Стяжка по армирующей сетке с гидроизоляцией примыканий", location: "Химки", area: "56 м²", year: 2025, image: sc04.url },
  { id: "t05", category: "repair", tag: "Стяжка пола", title: "Полусухая стяжка с подачей растворонасосом, вытяжка по маякам", location: "Москва, СВАО", area: "84 м²", year: 2026, image: sc05.url },
  { id: "t06", category: "repair", tag: "Стяжка пола", title: "Затирка полусухой стяжки шлифмашиной в новостройке", location: "Люберцы", area: "44 м²", year: 2025, image: sc06.url },
  { id: "t07", category: "repair", tag: "Стяжка пола", title: "Полусухая стяжка в общественном помещении, слой 60 мм", location: "Москва, ЮВАО", area: "140 м²", year: 2025, image: sc07.url },
  { id: "t08", category: "repair", tag: "Стяжка пола", title: "Стяжка коридора с лазерным нивелиром и подачей по шлангу", location: "Мытищи", area: "38 м²", year: 2025, image: sc08.url },
  { id: "t09", category: "repair", tag: "Стяжка пола", title: "Финишная затирка стяжки вертолётом до гладкой поверхности", location: "Балашиха", area: "52 м²", year: 2026, image: sc09.url },
  { id: "t10", category: "repair", tag: "Стяжка пола", title: "Стяжка по тёплому полу на матах с бобышками в загородном доме", location: "Пушкинский округ", area: "126 м²", year: 2025, image: sc10.url },
];

export function getShowcaseByCategory(category: ServiceCategory, limit = 6): ShowcaseProject[] {
  return SHOWCASE_PROJECTS.filter((p) => p.category === category).slice(0, limit);
}
