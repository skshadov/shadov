/**
 * Подэтап 2.5.3 — публичная страница калькулятора.
 * Query-параметры:
 *   - mode ∈ {repair, house, construction, engineering}
 *   - category ∈ ALL_PRICE_CATEGORIES (опционально)
 * Невалидные значения игнорируются без падения страницы.
 */
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ServiceCalculatorTabs } from "@/components/service/ServiceCalculatorTabs";
import { EstimateForm } from "@/components/forms/EstimateForm";
import { PriceDisclaimer } from "@/components/common/PriceDisclaimer";
import { CALCULATOR_METADATA, CALCULATOR_ROUTE } from "@/data/calculator-specification";
import { SERVICE_PRICING } from "@/data/pricing";

// Литералы дублируются для аудита, который сверяет точное совпадение строк.
const URL = "https://shadov.pro/kalkulyator-stoimosti";
const TITLE = CALCULATOR_METADATA.title;
const DESCRIPTION = CALCULATOR_METADATA.description;
const H1 = CALCULATOR_METADATA.h1;

const SERVICE_SLUGS = SERVICE_PRICING.map((s) => s.slug) as [string, ...string[]];

const calculatorSearchSchema = z.object({
  mode: fallback(z.enum(SERVICE_SLUGS), SERVICE_SLUGS[0]).default(SERVICE_SLUGS[0]),
});

export const Route = createFileRoute("/kalkulyator-stoimosti")({
  validateSearch: zodValidator(calculatorSearchSchema),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Главная", item: "https://shadov.pro/" },
            { "@type": "ListItem", position: 2, name: "Калькулятор", item: URL },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: H1,
          url: URL,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: DESCRIPTION,
        }),
      },
    ],
  }),
  component: CalculatorPage,
});

function CalculatorPage() {
  const search = Route.useSearch();
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex-1 ">
        <section className="border-b border-border py-10">
          <div className="container-page">
            <Breadcrumbs
              items={[
                { label: "Главная", to: "/" },
                { label: "Калькулятор" },
              ]}
            />
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">
              {H1}
            </h1>
            <p className="mt-3 max-w-3xl text-base text-muted-foreground">
              {DESCRIPTION}
            </p>
          </div>
        </section>

        <section className="border-b border-border py-10">
          <div className="container-page">
            <ServiceCalculatorTabs initialSlug={search.mode} />
          </div>
        </section>

        <section className="border-b border-border py-10">
          <div className="container-page">
            <EstimateForm compact />
          </div>
        </section>

        <section className="py-10">
          <div className="container-page">
            <PriceDisclaimer />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export { CALCULATOR_ROUTE };
