import {
  HOUSE_COMPLETION_DISCLAIMER,
  HOUSE_COMPLETION_LEVELS,
  HOUSE_TECHNOLOGIES,
  HOUSE_TURNKEY_WITH_BASIC_MATERIALS_LABEL,
} from "@/data/house-technologies";
import { CONSTRUCTION_SERVICE_PAGES as constructionPages } from "@/data/service-pages-construction";
import { readFileSync } from "fs";
import { resolve } from "path";

const ACTIVE_ROUTES = [
  "/stroitelstvo-domov-pod-klyuch",
  "/karkasnye-doma",
  "/doma-iz-sip-paneley",
  "/doma-iz-brusa",
  "/doma-iz-kleenogo-brusa",
  "/doma-iz-gazobetona",
  "/doma-iz-keramicheskih-blokov",
  "/kirpichnye-doma",
  "/monolitnye-doma",
  "/kombinirovannye-doma",
];

const STUB_ROUTES = [
  "/stroitelstvo",
  "/mnogokvartirnye-doma",
  "/generalnyy-podryad",
  "/monolitnye-raboty",
  "/fundamenty",
  "/kladochnye-raboty",
  "/krovelnye-raboty",
  "/fasadnye-raboty",
];

function readRouteSrc(route: string): string {
  return readFileSync(resolve(process.cwd(), `src/routes${route}.tsx`), "utf8");
}

function findCanonical(src: string): string | null {
  if (!/rel:\s*"canonical"/.test(src)) return null;
  const urlMatch = src.match(/const\s+URL\s*=\s*"([^"]+)"/);
  if (urlMatch) return urlMatch[1];
  const literal = src.match(/rel:\s*"canonical",\s*href:\s*"([^"]+)"/);
  return literal ? literal[1] : null;
}

function findH1ForRoute(route: string): string | null {
  const page = constructionPages.find((p) => p.route === route);
  return page ? page.h1 : null;
}

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

  activeRouteStatus: ACTIVE_ROUTES.map((route) => {
    const src = readRouteSrc(route);
    return {
      route,
      usesConstructionServicePage: /ConstructionServicePage/.test(src),
      hasRouteStub: /RouteStub/.test(src),
      hasNoindex: /noindex/i.test(src),
      canonical: findCanonical(src),
      h1: findH1ForRoute(route),
    };
  }),

  stubRouteStatus: STUB_ROUTES.map((route) => {
    const src = readRouteSrc(route);
    return {
      route,
      hasRouteStub: /RouteStub/.test(src),
      hasNoindexFollow: /noindex,\s*follow/.test(src),
      usesConstructionServicePage: /ConstructionServicePage/.test(src),
    };
  }),
};

console.log(JSON.stringify(audit, null, 2));