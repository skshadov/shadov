import { createFileRoute } from "@tanstack/react-router";
import { EngineeringServicePage } from "@/components/services/EngineeringServicePage";
import { getServicePage } from "@/data/service-pages";

const SLUG = "teplyy-pol";
const URL = "https://shadov.pro/teplyy-pol";

export const Route = createFileRoute("/teplyy-pol")({
  head: () => {
    const p = getServicePage(SLUG)!;
    return {
      meta: [
        { title: p.metaTitle },
        { name: "description", content: p.metaDescription },
        { property: "og:title", content: p.metaTitle },
        { property: "og:description", content: p.metaDescription },
        { property: "og:type", content: "website" },
        { property: "og:url", content: URL },
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
              { "@type": "ListItem", position: 2, name: "Инженерные системы", item: "https://shadov.pro/inzhenernye-sistemy" },
              { "@type": "ListItem", position: 3, name: "Тёплый пол", item: URL },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: p.h1,
            areaServed: "Москва и Московская область",
            provider: { "@type": "Organization", name: "Шадов и партнёры" },
            url: URL,
          }),
        },
      ],
    };
  },
  component: () => <EngineeringServicePage slug={SLUG} />,
});
