import { createFileRoute } from "@tanstack/react-router";
import { ConstructionServicePage } from "@/components/services/ConstructionServicePage";
import { getServicePage } from "@/data/service-pages";

const SLUG = "generalnyy-podryad";
const URL = "https://shadov.pro/generalnyy-podryad";

export const Route = createFileRoute("/generalnyy-podryad")({
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
              { "@type": "ListItem", position: 2, name: "Строительство", item: "https://shadov.pro/stroitelstvo" },
              { "@type": "ListItem", position: 3, name: "Генеральный подряд", item: URL },
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
  component: () => <ConstructionServicePage slug={SLUG} />,
});
