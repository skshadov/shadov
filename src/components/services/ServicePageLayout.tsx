/**
 * Подэтап 2.1 — общий шаблон страницы услуги.
 * Не содержит данных конкретной услуги. Пустые секции не рендерятся.
 * Исключение: портфолио и отзывы всегда показывают честный empty state.
 */
import { ServiceHero } from "./ServiceHero";
import { ServiceBenefits } from "./ServiceBenefits";
import { ServiceApplications } from "./ServiceApplications";
import { ServiceScope } from "./ServiceScope";
import { ServiceExclusions } from "./ServiceExclusions";
import { ServicePackages } from "./ServicePackages";
import { ServiceTechnology } from "./ServiceTechnology";
import { ServiceStages } from "./ServiceStages";
import { ServiceQualityControl } from "./ServiceQualityControl";
import { ServicePriceTable } from "./ServicePriceTable";
import { ServiceEstimateExample, type EstimateExampleRow } from "./ServiceEstimateExample";
import { ServiceDocuments } from "./ServiceDocuments";
import { ServiceTimeline } from "./ServiceTimeline";
import { ServicePortfolio } from "./ServicePortfolio";
import { ServiceReviews } from "./ServiceReviews";
import { ServiceFaq } from "./ServiceFaq";
import { RelatedServices } from "./RelatedServices";
import { ServiceEstimateCta } from "./ServiceEstimateCta";
import { CalculatorCta } from "@/components/calculator/CalculatorCta";
import type { ResolvedServicePage } from "@/lib/get-service-data";
import type { BreadcrumbItem } from "@/components/common/Breadcrumbs";

interface ServicePageLayoutProps {
  resolved: ResolvedServicePage;
  breadcrumbs: BreadcrumbItem[];
  estimateExample?: EstimateExampleRow[];
}

export function ServicePageLayout({ resolved, breadcrumbs, estimateExample = [] }: ServicePageLayoutProps) {
  const { data, prices, faq, packages, related } = resolved;
  return (
    <article>
      <ServiceHero
        breadcrumbs={breadcrumbs}
        h1={data.h1}
        description={data.description}
        startingPrice={data.startingPrice}
      />
      <ServiceApplications items={data.suitableFor} />
      <ServiceBenefits items={data.benefits} />
      <ServiceScope items={data.included} />
      <ServiceExclusions items={data.excluded} />
      <ServicePackages packages={packages} />
      <ServiceTechnology items={data.technology} />
      <ServiceStages items={data.stages} />
      <ServiceQualityControl items={data.qualityControl} />
      <ServicePriceTable items={prices} />
      <ServiceEstimateExample rows={estimateExample} />
      <ServiceDocuments items={data.documents} />
      <ServiceTimeline items={data.timelineFactors} />
      <ServicePortfolio />
      <ServiceReviews />
      <ServiceFaq items={faq} />
      <CalculatorCta slug={data.slug} />
      <ServiceEstimateCta />
      <RelatedServices items={related} />
    </article>
  );
}
