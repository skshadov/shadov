import { createFileRoute } from "@tanstack/react-router";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { TrustBar } from "@/components/home/TrustBar";
import { ServiceDirections } from "@/components/home/ServiceDirections";
import { StartingPrices } from "@/components/home/StartingPrices";
import { DirectContractSection } from "@/components/home/DirectContractSection";
import { ProjectControlSection } from "@/components/home/ProjectControlSection";
import { StagePaymentSection } from "@/components/home/StagePaymentSection";
import { ServicesOverview } from "@/components/home/ServicesOverview";
import { PortfolioPreview } from "@/components/home/PortfolioPreview";
import { QualityPriceSection } from "@/components/home/QualityPriceSection";
import { HowWeWorkSection } from "@/components/home/HowWeWorkSection";
import { TeamPreview } from "@/components/home/TeamPreview";
import { ReviewsPreview } from "@/components/home/ReviewsPreview";
import { FaqSection } from "@/components/home/FaqSection";

const TITLE =
  "Шадов и партнёры — строительство и ремонт под ключ в Москве и МО";
const DESCRIPTION =
  "Генеральный подрядчик с допуском СРО. Строительство частных и многоквартирных домов, ремонт квартир и домов, монолит, кладка, кровля, электрика, сантехника, отопление и плитка.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex-1">
        <HeroSection />
        <TrustBar />
        <ServiceDirections />
        <StartingPrices />
        <DirectContractSection />
        <ProjectControlSection />
        <StagePaymentSection />
        <ServicesOverview />
        <PortfolioPreview />
        <QualityPriceSection />
        <HowWeWorkSection />
        <TeamPreview />
        <ReviewsPreview />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
