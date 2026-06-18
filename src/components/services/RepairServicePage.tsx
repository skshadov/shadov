/**
 * Подэтап 2.3 — общий каркас наполненной страницы ремонта.
 * Header + Footer + breadcrumbs + дисклеймер цены сверху и снизу,
 * одна AI-иллюстрация (direction-renovation), ServicePageLayout с
 * данными из service-pages.ts и пример структуры сметы из первой
 * привязанной ценовой категории.
 */
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PriceDisclaimer } from "@/components/common/PriceDisclaimer";
import { Illustration } from "@/components/common/Illustration";
import { renovationPicture } from "@/assets/illustrations/sources";
import { ServicePageLayout } from "./ServicePageLayout";
import { resolveServicePage } from "@/lib/get-service-data";
import type { EstimateExampleRow } from "./ServiceEstimateExample";
import type { BreadcrumbItem } from "@/components/common/Breadcrumbs";

interface RepairServicePageProps {
  slug: string;
}

const EXAMPLE_VOLUMES = [40, 25, 18, 12, 8];

export function RepairServicePage({ slug }: RepairServicePageProps) {
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

  // Пример структуры сметы — первые позиции первой ценовой категории.
  // Демонстрационные объёмы, не итог объекта (см. ServiceEstimateExample).
  const exampleSource = resolved.prices
    .filter((p) => typeof p.priceFrom === "number" && p.priceFrom > 0)
    .slice(0, 5);
  const estimateExample: EstimateExampleRow[] = exampleSource.map((item, i) => ({
    item,
    volume: EXAMPLE_VOLUMES[i] ?? 10,
  }));

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Главная", to: "/" },
    { label: "Ремонт", to: "/remont" },
    ...(slug === "remont" ? [] : [{ label: data.title } as BreadcrumbItem]),
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex-1">
        <ServicePageLayout
          resolved={resolved}
          breadcrumbs={breadcrumbs}
          estimateExample={estimateExample}
        />
        <section className="border-b border-border py-10">
          <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-center">
            <PriceDisclaimer />
            <Illustration
              {...renovationPicture}
              description="ремонт и финишная отделка помещения"
              imgClassName="rounded-lg"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}