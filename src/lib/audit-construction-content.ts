import {
  HOUSE_COMPLETION_DISCLAIMER,
  HOUSE_COMPLETION_LEVELS,
  HOUSE_TECHNOLOGIES,
} from "@/data/house-technologies";
import { CONSTRUCTION_SERVICE_PAGES as constructionPages } from "@/data/service-pages-construction";

const audit = {
  routes: constructionPages.map(({ route, h1, startingPrice }) => ({
    route,
    h1,
    startingPrice,
  })),

  technologies: HOUSE_TECHNOLOGIES.map(({ slug, name }) => ({
    slug,
    name,
  })),

  completionLevels: HOUSE_COMPLETION_LEVELS.map(
    ({ id, name, included, excluded }) => ({
      id,
      name,
      included,
      excluded,
    }),
  ),

  completionDisclaimer: HOUSE_COMPLETION_DISCLAIMER,
};

console.log(JSON.stringify(audit, null, 2));