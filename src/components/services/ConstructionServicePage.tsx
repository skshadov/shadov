/**
 * Подэтап 2.4.1 — общий каркас строительной страницы.
 * На 2.4.1 компонент создан, но к route-файлам ещё не подключён.
 * Подключение к маршрутам выполняется в итерациях 2.4.2–2.4.4.
 *
 * Архитектура:
 *  - данные берутся из service-pages-construction.ts через resolveServicePage;
 *  - цены — из prices.ts через priceCategoryIds;
 *  - технологические блоки — из HOUSE_TECHNOLOGIES;
 *  - в компоненте нет захардкоженных цен.
 */
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PriceDisclaimer } from "@/components/common/PriceDisclaimer";
import { ServicePageLayout } from "./ServicePageLayout";
import { resolveServicePage } from "@/lib/get-service-data";
import type { EstimateExampleRow } from "./ServiceEstimateExample";
import type { BreadcrumbItem } from "@/components/common/Breadcrumbs";
import { getPriceById } from "@/data/prices";
import { getHouseTechnology } from "@/data/house-technologies";
import { HouseTechnologyMatrix } from "@/components/construction/HouseTechnologyMatrix";
import { HouseCompletionLevels } from "@/components/construction/HouseCompletionLevels";
import { HouseTechnologyDetails } from "@/components/construction/HouseTechnologyDetails";
import { HouseTechnologyPrices } from "@/components/construction/HouseTechnologyPrices";
import { ConstructionDirections } from "@/components/construction/ConstructionDirections";

interface Props {
  slug: string;
}

/** Маршруты, на которых уместна полная матрица технологий и уровней готовности. */
const SLUGS_WITH_MATRIX = new Set<string>([
  "stroitelstvo",
  "stroitelstvo-domov-pod-klyuch",
]);

export function ConstructionServicePage({ slug }: Props) {
  const resolved = resolveServicePage(slug);
  if (!resolved) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main id="main" className="container-page py-20">
          <h1 className="font-display text-3xl font-semibold">Страница не найдена</h1>
        </main>
        <Footer />
      </div>
    );
  }
  const { data } = resolved;

  // Пример сметы строится ТОЛЬКО по явным estimateExampleItemIds.
  const ids = data.estimateExampleItemIds ?? [];
  const estimateExample: EstimateExampleRow[] = [];
  for (const id of ids) {
    const item = getPriceById(id);
    if (!item) continue;
    const vol = data.estimateExampleVolumes?.[id];
    const row: EstimateExampleRow = { item };
    if (vol) {
      row.volume = vol.value;
    }
    const note = data.estimateExampleNotes?.[id];
    if (note) row.note = note;
    estimateExample.push(row);
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Главная", to: "/" },
    { label: "Строительство", to: "/stroitelstvo" },
    ...(slug === "stroitelstvo" ? [] : [{ label: data.title } as BreadcrumbItem]),
  ];

  const tech = getHouseTechnology(slug);
  const showMatrix = SLUGS_WITH_MATRIX.has(slug);
  const showLevels = showMatrix || Boolean(tech);
  const showDirections = slug === "stroitelstvo";

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex-1">
        <ServicePageLayout
          resolved={resolved}
          breadcrumbs={breadcrumbs}
          estimateExample={estimateExample}
        />
        {showDirections ? <ConstructionDirections /> : null}
        {showMatrix ? (
          <HouseTechnologyMatrix heading="Технологии и уровни готовности" />
        ) : null}
        {tech ? <HouseTechnologyPrices tech={tech} /> : null}
        {showLevels ? <HouseCompletionLevels /> : null}
        {tech ? <HouseTechnologyDetails tech={tech} /> : null}
        <section className="border-b border-border py-10">
          <div className="container-page">
            <PriceDisclaimer />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
