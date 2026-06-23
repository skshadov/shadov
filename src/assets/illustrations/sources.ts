/**
 * Источники иллюстраций: AVIF + WebP + JPG fallback.
 * Vite инлайнит каждый импорт; компонент <picture> сам выбирает оптимальный формат.
 */
import heroJpg1920 from "./hero-construction-1920.jpg";
import heroJpg1280 from "./hero-construction-1280.jpg";
import heroJpg768 from "./hero-construction-768.jpg";
import heroWebp1920 from "./hero-construction-1920.webp";
import heroWebp1280 from "./hero-construction-1280.webp";
import heroWebp768 from "./hero-construction-768.webp";
import heroAvif1920 from "./hero-construction-1920.avif";
import heroAvif1280 from "./hero-construction-1280.avif";
import heroAvif768 from "./hero-construction-768.avif";

import housesJpg from "./direction-houses.jpg";
import housesJpg800 from "./direction-houses-800.jpg";
import housesWebp from "./direction-houses.webp";
import housesWebp800 from "./direction-houses-800.webp";
import housesAvif from "./direction-houses.avif";
import housesAvif800 from "./direction-houses-800.avif";

import renovationJpg from "./direction-renovation.jpg";
import renovationJpg800 from "./direction-renovation-800.jpg";
import renovationWebp from "./direction-renovation.webp";
import renovationWebp800 from "./direction-renovation-800.webp";
import renovationAvif from "./direction-renovation.avif";
import renovationAvif800 from "./direction-renovation-800.avif";

import monolithJpg from "./direction-monolith.jpg";
import monolithJpg800 from "./direction-monolith-800.jpg";
import monolithWebp from "./direction-monolith.webp";
import monolithWebp800 from "./direction-monolith-800.webp";
import monolithAvif from "./direction-monolith.avif";
import monolithAvif800 from "./direction-monolith-800.avif";

import engineeringJpg from "./direction-engineering.jpg";
import engineeringJpg800 from "./direction-engineering-800.jpg";
import engineeringWebp from "./direction-engineering.webp";
import engineeringWebp800 from "./direction-engineering-800.webp";
import engineeringAvif from "./direction-engineering.avif";
import engineeringAvif800 from "./direction-engineering-800.avif";

import controlJpg from "./control-foreman.jpg";
import controlJpg800 from "./control-foreman-800.jpg";
import controlWebp from "./control-foreman.webp";
import controlWebp800 from "./control-foreman-800.webp";
import controlAvif from "./control-foreman.avif";
import controlAvif800 from "./control-foreman-800.avif";

import apartmentsJpg from "./direction-apartments.jpg";
import apartmentsJpg800 from "./direction-apartments-800.jpg";
import apartmentsWebp from "./direction-apartments.webp";
import apartmentsWebp800 from "./direction-apartments-800.webp";
import apartmentsAvif from "./direction-apartments.avif";
import apartmentsAvif800 from "./direction-apartments-800.avif";

import generalJpg from "./direction-general.jpg";
import generalJpg800 from "./direction-general-800.jpg";
import generalWebp from "./direction-general.webp";
import generalWebp800 from "./direction-general-800.webp";
import generalAvif from "./direction-general.avif";
import generalAvif800 from "./direction-general-800.avif";

import masonryJpg from "./direction-masonry.jpg";
import masonryJpg800 from "./direction-masonry-800.jpg";
import masonryWebp from "./direction-masonry.webp";
import masonryWebp800 from "./direction-masonry-800.webp";
import masonryAvif from "./direction-masonry.avif";
import masonryAvif800 from "./direction-masonry-800.avif";

import roofJpg from "./direction-roof.jpg";
import roofJpg800 from "./direction-roof-800.jpg";
import roofWebp from "./direction-roof.webp";
import roofWebp800 from "./direction-roof-800.webp";
import roofAvif from "./direction-roof.avif";
import roofAvif800 from "./direction-roof-800.avif";

import plumbingJpg from "./direction-plumbing.jpg";
import plumbingJpg800 from "./direction-plumbing-800.jpg";
import plumbingWebp from "./direction-plumbing.webp";
import plumbingWebp800 from "./direction-plumbing-800.webp";
import plumbingAvif from "./direction-plumbing.avif";
import plumbingAvif800 from "./direction-plumbing-800.avif";

import heatingJpg from "./direction-heating.jpg";
import heatingJpg800 from "./direction-heating-800.jpg";
import heatingWebp from "./direction-heating.webp";
import heatingWebp800 from "./direction-heating-800.webp";
import heatingAvif from "./direction-heating.avif";
import heatingAvif800 from "./direction-heating-800.avif";

import tileJpg from "./direction-tile.jpg";
import tileJpg800 from "./direction-tile-800.jpg";
import tileWebp from "./direction-tile.webp";
import tileWebp800 from "./direction-tile-800.webp";
import tileAvif from "./direction-tile.avif";
import tileAvif800 from "./direction-tile-800.avif";

import type { IllustrationSource } from "@/components/common/Illustration";

export const heroPicture = {
  src: heroJpg1280,
  width: 1920,
  height: 1080,
  sources: [
    // mobile
    {
      type: "image/avif" as const,
      media: "(max-width: 767px)",
      srcSet: heroAvif768,
    },
    {
      type: "image/webp" as const,
      media: "(max-width: 767px)",
      srcSet: heroWebp768,
    },
    {
      type: "image/jpeg" as const,
      media: "(max-width: 767px)",
      srcSet: heroJpg768,
    },
    // desktop
    {
      type: "image/avif" as const,
      srcSet: `${heroAvif1280} 1280w, ${heroAvif1920} 1920w`,
      sizes: "100vw",
    },
    {
      type: "image/webp" as const,
      srcSet: `${heroWebp1280} 1280w, ${heroWebp1920} 1920w`,
      sizes: "100vw",
    },
  ] satisfies IllustrationSource[],
  imgSrcSet: `${heroJpg1280} 1280w, ${heroJpg1920} 1920w`,
  imgSizes: "100vw",
};

function card(avif: string, avif800: string, webp: string, webp800: string, jpg: string, jpg800: string) {
  return {
    src: jpg,
    width: 1280,
    height: 960,
    sources: [
      { type: "image/avif" as const, srcSet: `${avif800} 800w, ${avif} 1280w`, sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" },
      { type: "image/webp" as const, srcSet: `${webp800} 800w, ${webp} 1280w`, sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" },
    ] satisfies IllustrationSource[],
    imgSrcSet: `${jpg800} 800w, ${jpg} 1280w`,
    imgSizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  };
}

export const housesPicture = card(housesAvif, housesAvif800, housesWebp, housesWebp800, housesJpg, housesJpg800);
export const renovationPicture = card(renovationAvif, renovationAvif800, renovationWebp, renovationWebp800, renovationJpg, renovationJpg800);
export const monolithPicture = card(monolithAvif, monolithAvif800, monolithWebp, monolithWebp800, monolithJpg, monolithJpg800);
export const engineeringPicture = card(engineeringAvif, engineeringAvif800, engineeringWebp, engineeringWebp800, engineeringJpg, engineeringJpg800);
export const controlPicture = card(controlAvif, controlAvif800, controlWebp, controlWebp800, controlJpg, controlJpg800);
export const apartmentsPicture = card(apartmentsAvif, apartmentsAvif800, apartmentsWebp, apartmentsWebp800, apartmentsJpg, apartmentsJpg800);
export const generalPicture = card(generalAvif, generalAvif800, generalWebp, generalWebp800, generalJpg, generalJpg800);
export const masonryPicture = card(masonryAvif, masonryAvif800, masonryWebp, masonryWebp800, masonryJpg, masonryJpg800);
export const roofPicture = card(roofAvif, roofAvif800, roofWebp, roofWebp800, roofJpg, roofJpg800);
export const plumbingPicture = card(plumbingAvif, plumbingAvif800, plumbingWebp, plumbingWebp800, plumbingJpg, plumbingJpg800);
export const heatingPicture = card(heatingAvif, heatingAvif800, heatingWebp, heatingWebp800, heatingJpg, heatingJpg800);
export const tilePicture = card(tileAvif, tileAvif800, tileWebp, tileWebp800, tileJpg, tileJpg800);
