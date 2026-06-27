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
import { getPriceById } from "@/data/prices";

interface RepairServicePageProps {
  slug: string;
}

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

  // Подэтап 2.3A — пример структуры сметы формируется ТОЛЬКО по явному
  // перечню estimateExampleItemIds. Автоматический slice(0, 5) запрещён.
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