/**
 * Пять профильных направлений компании для карточек на главной.
 */
import type { ComponentType, SVGProps } from "react";
import { Layers, Plug, Droplets, Flame, PaintRoller } from "lucide-react";

export interface DirectionCard {
  title: string;
  description: string;
  startPrice: string;
  to: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const HOME_DIRECTIONS: DirectionCard[] = [
  {
    title: "Механизированная штукатурка",
    description: "Стены и потолки под покраску и обои, маяки, углы, откосы",
    startPrice: "550 ₽/м² за работу",
    to: "/mekhanizirovannaya-shtukaturka",
    Icon: PaintRoller,
  },
  {
    title: "Мокрая стяжка пола",
    description: "Классическая цементно-песчаная стяжка по маякам под любое покрытие",
    startPrice: "550 ₽/м² за работу",
    to: "/styazhka-pola",
    Icon: Layers,
  },
  {
    title: "Полусухая стяжка пола",
    description: "Механизированная укладка с фиброй — ходить через сутки",
    startPrice: "450 ₽/м² за работу",
    to: "/polusuhaya-styazhka",
    Icon: Layers,
  },
  {
    title: "Тёплый пол",
    description: "Водяной и электрический контур со стяжкой и опрессовкой",
    startPrice: "700 ₽/м² за работу",
    to: "/teplyy-pol",
    Icon: Flame,
  },
  {
    title: "Разводка электрики",
    description: "Черновая электрика: штробы, кабель, подрозетники, щит",
    startPrice: "1 100 ₽ за точку — работа",
    to: "/razvodka-elektriki",
    Icon: Plug,
  },
  {
    title: "Разводка сантехники",
    description: "Черновая сантехника: вода, канализация, коллектор, опрессовка",
    startPrice: "2 400 ₽ за точку — работа",
    to: "/razvodka-santehniki",
    Icon: Droplets,
  },
];
