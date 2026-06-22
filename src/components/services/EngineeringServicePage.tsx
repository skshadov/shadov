/**
 * Подэтап 2.5.1 — общий каркас инженерной страницы.
 * На 2.5.1 компонент создан, но к route-файлам ещё не подключён.
 * Подключение к маршрутам выполняется в 2.5.2.
 *
 * Архитектура:
 *   - данные берутся из service-pages-engineering.ts через resolveServicePage;
 *   - цены — из prices.ts через priceCategoryIds;
 *   - в компоненте нет захардкоженных цен.
 */
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PriceDisclaimer } from "@/components/common/PriceDisclaimer";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/common/Breadcrumbs";
import { Link } from "@tanstack/react-router";
import { resolveServicePage } from "@/lib/get-service-data";
import { getPriceById, getPricesByCategory } from "@/data/prices";
import { EngineeringDirections } from "@/components/engineering/EngineeringDirections";
import { EngineeringPriceGroups } from "@/components/engineering/EngineeringPriceGroups";
import { EngineeringSystemDetails } from "@/components/engineering/EngineeringSystemDetails";
import { EngineeringPackageCard } from "@/components/engineering/EngineeringPackageCard";
import { EmptyPortfolioState } from "@/components/content/EmptyPortfolioState";
import { ServiceFaq } from "@/components/services/ServiceFaq";
import { ServiceEstimateExample, type EstimateExampleRow } from "@/components/services/ServiceEstimateExample";
import { EstimateForm } from "@/components/forms/EstimateForm";
import { RelatedServices } from "@/components/services/RelatedServices";
import { Illustration } from "@/components/common/Illustration";
import { engineeringPicture } from "@/assets/illustrations/sources";

interface Props {
  slug: string;
}

const OVERVIEW_SLUG = "inzhenernye-sistemy";

export function EngineeringServicePage({ slug }: Props) {
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
  const { data, faq, related } = resolved;

  const ids = data.estimateExampleItemIds ?? [];
  const estimateExample: EstimateExampleRow[] = [];
  for (const id of ids) {
    const item = getPriceById(id);
    if (!item) continue;
    const vol = data.estimateExampleVolumes?.[id];
    const row: EstimateExampleRow = { item };
    if (vol) {
      row.volume = vol.value;
      row.volumeLabel = vol.label;
    }
    const note = data.estimateExampleNotes?.[id];
    if (note) row.note = note;
    estimateExample.push(row);
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Главная", to: "/" },
    { label: "Инженерные системы", to: "/inzhenernye-sistemy" },
    ...(slug === OVERVIEW_SLUG ? [] : [{ label: data.title } as BreadcrumbItem]),
  ];

  const packages = (data.packageCategoryIds ?? []).flatMap((c) => getPricesByCategory(c));
  const isOverview = slug === OVERVIEW_SLUG;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex-1">
        <section className="border-b border-border py-10">
          <div className="container-page">
            <Breadcrumbs items={breadcrumbs} />
            <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
              {data.h1}
            </h1>
            {data.intro ? (
              <p className="mt-4 max-w-3xl text-base text-muted-foreground">
                {data.intro}
              </p>
            ) : null}
            {isOverview ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {data.startingPriceNote ?? "Стоимость рассчитывается по составу работ"}
              </p>
            ) : data.startingPrice ? (
              <p className="mt-4 text-lg font-semibold">{data.startingPrice}</p>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                {data.startingPriceNote ?? "Стоимость рассчитывается по составу работ"}
              </p>
            )}
          </div>
        </section>

        <section className="border-b border-border py-10">
          <div className="container-page">
            <Illustration
              {...engineeringPicture}
              description={`инженерное направление — ${data.h1.toLowerCase()}`}
            />
          </div>
        </section>

        {isOverview ? <EngineeringDirections /> : null}

        {!isOverview && packages.length > 0 ? (
          <section className="border-b border-border py-12">
            <div className="container-page">
              <h2 className="font-display text-2xl font-semibold">Пакетные решения</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => (
                  <EngineeringPackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {!isOverview ? (
          <EngineeringPriceGroups
            packageCategoryIds={data.packageCategoryIds}
            priceCategoryIds={data.priceCategoryIds}
          />
        ) : null}

        <EngineeringSystemDetails
          serviceGroups={data.serviceGroups}
          processSteps={data.processSteps}
          qualityControl={data.qualityControl}
          documents={data.documents}
          costFactors={data.costFactors}
        />

        {!isOverview && estimateExample.length > 0 ? (
          <ServiceEstimateExample rows={estimateExample} />
        ) : null}

        <section className="border-b border-border py-10">
          <div className="container-page">
            <EmptyPortfolioState />
          </div>
        </section>

        <section className="border-b border-border py-10">
          <div className="container-page">
            <h2 className="font-display text-2xl font-semibold">Отзывы</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Раздел наполняется подтверждёнными отзывами заказчиков.
            </p>
          </div>
        </section>

        <ServiceFaq items={faq} />

        <section className="border-b border-border py-10">
          <div className="container-page">
            <EstimateForm />
          </div>
        </section>

        <RelatedServices items={related} />

        <section className="border-b border-border py-10">
          <div className="container-page">
            <PriceDisclaimer />
            <p className="mt-4 text-sm">
              <Link to="/prices" className="underline">
                Полный прайс — /prices
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}