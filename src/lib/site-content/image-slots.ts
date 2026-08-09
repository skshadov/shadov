/**
 * Реестр заменяемых фотографий сайта. Ключ слота используется в компонентах
 * (`useSiteImageUrl`) и в админке «Фото сайта».
 */
export interface ImageSlot {
  key: string;
  label: string;
  group: string;
  /** Рекомендуемый размер файла */
  width: number;
  height: number;
  aspect: string;
  hint: string;
}

export const IMAGE_SLOTS: ImageSlot[] = [
  {
    key: "home.hero.screed",
    label: "Главная — коллаж, крупное фото «Стяжка пола»",
    group: "Главная страница",
    width: 1600,
    height: 1200,
    aspect: "4:3",
    hint: "Реальный процесс заливки и выравнивания стяжки на объекте",
  },
  {
    key: "home.hero.heating",
    label: "Главная — коллаж, фото «Тёплый пол»",
    group: "Главная страница",
    width: 1600,
    height: 1200,
    aspect: "4:3",
    hint: "Контуры тёплого пола и коллекторный узел",
  },
  {
    key: "home.hero.engineering",
    label: "Главная — коллаж, малое фото «Черновая инженерия»",
    group: "Главная страница",
    width: 1200,
    height: 900,
    aspect: "4:3",
    hint: "Узел черновой инженерии: трубы и электрика",
  },
  {
    key: "direction.shtukaturka",
    label: "Карточка направления «Механизированная штукатурка»",
    group: "Карточки направлений",
    width: 1280,
    height: 960,
    aspect: "4:3",
    hint: "Работа штукатурной станции, нанесение и правило по стене",
  },
  {
    key: "direction.styazhka",
    label: "Карточка направления «Мокрая стяжка пола»",
    group: "Карточки направлений",
    width: 1280,
    height: 960,
    aspect: "4:3",
    hint: "Выравнивание мокрой стяжки правилом внутри помещения",
  },
  {
    key: "direction.polusuhaya",
    label: "Карточка направления «Полусухая стяжка пола»",
    group: "Карточки направлений",
    width: 1280,
    height: 960,
    aspect: "4:3",
    hint: "Затирка полусухой стяжки шлифовальной машиной",
  },
  {
    key: "direction.teplyy-pol",
    label: "Карточка направления «Тёплый пол»",
    group: "Карточки направлений",
    width: 1280,
    height: 960,
    aspect: "4:3",
    hint: "Укладка водяного тёплого пола с коллектором",
  },
  {
    key: "direction.elektrika",
    label: "Карточка направления «Разводка электрики»",
    group: "Карточки направлений",
    width: 1280,
    height: 960,
    aspect: "4:3",
    hint: "Штробы, кабельные трассы, электрощит",
  },
  {
    key: "direction.santehnika",
    label: "Карточка направления «Разводка сантехники»",
    group: "Карточки направлений",
    width: 1280,
    height: 960,
    aspect: "4:3",
    hint: "Черновая разводка водоснабжения и канализации",
  },
];

export function getImageSlot(key: string): ImageSlot | undefined {
  return IMAGE_SLOTS.find((s) => s.key === key);
}