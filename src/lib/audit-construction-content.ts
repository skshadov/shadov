import {
  HOUSE_COMPLETION_DISCLAIMER,
  HOUSE_COMPLETION_LEVELS,
  HOUSE_TECHNOLOGIES,
  HOUSE_TURNKEY_WITH_BASIC_MATERIALS_LABEL,
} from "@/data/house-technologies";
import { CONSTRUCTION_SERVICE_PAGES as constructionPages } from "@/data/service-pages-construction";

const audit = {
  routes: constructionPages.map(({ route, h1, startingPrice }) => ({
    route,
    h1,
    startingPrice,
  })),

  technologies: HOUSE_TECHNOLOGIES.map((t) => ({
    slug: t.slug,
    name: t.name,
    prices: {
      shell: t.workPrices.shell,
      warmShell: t.workPrices.warmShell,
      preFinish: t.workPrices.preFinish,
      turnkey: t.workPrices.turnkey,
      turnkeyWithBasicMaterials: t.turnkeyWithBasicMaterials,
    },
  })),

  matrixLabels: {
    shell: HOUSE_COMPLETION_LEVELS[0].name,
    warmShell: HOUSE_COMPLETION_LEVELS[1].name,
    preFinish: HOUSE_COMPLETION_LEVELS[2].name,
    turnkey: HOUSE_COMPLETION_LEVELS[3].name,
    materials: HOUSE_TURNKEY_WITH_BASIC_MATERIALS_LABEL,
  },

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