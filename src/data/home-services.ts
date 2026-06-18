/**
 * 11 основных направлений §12.2 ТЗ для карточек на главной.
 */
import type { ComponentType, SVGProps } from "react";
import {
  Building2,
  HardHat,
  Layers,
  PaintRoller,
  Plug,
  Droplets,
  Flame,
  SquareStack,
  Hammer,
  Home,
  Network,
} from "lucide-react";

export interface DirectionCard {
  title: string;
  description: string;
  startPrice: string;
  to: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const HOME_DIRECTIONS: DirectionCard[] = [
  {
    title: "Строительство домов",
    description: "Каркасные, газобетонные, кирпичные, монолитные — частные дома под ключ",
    startPrice: "от 45 000 ₽/м²",
    to: "/stroitelstvo-domov-pod-klyuch",
    Icon: Home,
  },
  {
    title: "Многоквартирное строительство",
    description: "Полный цикл — от котлована до сдачи в эксплуатацию",
    startPrice: "по проекту",
    to: "/mnogokvartirnye-doma",
    Icon: Building2,
  },
  {
    title: "Генеральный подряд",
    description: "Управление всем объектом с допуском СРО и единой ответственностью",
    startPrice: "по проекту",
    to: "/generalnyy-podryad",
    Icon: Network,
  },
  {
    title: "Монолитные работы",
    description: "Фундаментные плиты, перекрытия, колонны, лестницы, армопояса",
    startPrice: "от 18 000 ₽/м³",
    to: "/monolitnye-raboty",
    Icon: Layers,
  },
  {
    title: "Кладочные работы",
    description: "Газобетон, керамические блоки, кирпич, перегородки",
    startPrice: "по объёму",
    to: "/kladochnye-raboty",
    Icon: SquareStack,
  },
  {
    title: "Кровля",
    description: "Стропильные системы и кровельные покрытия любой сложности",
    startPrice: "по проекту",
    to: "/krovelnye-raboty",
    Icon: HardHat,
  },
  {
    title: "Ремонт под ключ",
    description: "От косметического до премиального — с инженерным контролем",
    startPrice: "от 12 000 ₽/м²",
    to: "/remont-pod-klyuch",
    Icon: PaintRoller,
  },
  {
    title: "Электрика",
    description: "Проектирование, прокладка, сборка щитов, чистовой монтаж",
    startPrice: "от 2 500 ₽/м²",
    to: "/elektromontazh",
    Icon: Plug,
  },
  {
    title: "Сантехника",
    description: "Коллекторные системы, защита от протечек, чистовой монтаж приборов",
    startPrice: "по объёму",
    to: "/santehnika",
    Icon: Droplets,
  },
  {
    title: "Отопление",
    description: "Котельные, радиаторы, тёплые полы, балансировка системы",
    startPrice: "по проекту",
    to: "/otoplenie",
    Icon: Flame,
  },
  {
    title: "Плитка",
    description: "Укладка крупноформатного керамогранита и стандартной плитки",
    startPrice: "от 2 800 ₽/м²",
    to: "/ukladka-plitki",
    Icon: Hammer,
  },
];