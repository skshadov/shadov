import { createFileRoute } from "@tanstack/react-router";
import { RepairServicePage } from "@/components/services/RepairServicePage";
import { getServicePage } from "@/data/service-pages";

const SLUG = "chistovaya-otdelka";
const URL = "https://shadov.pro/chistovaya-otdelka";

export const Route = createFileRoute("/chistovaya-otdelka")({
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
              { "@type": "ListItem", position: 2, name: "Ремонт", item: "https://shadov.pro/remont" },
              { "@type": "ListItem", position: 3, name: "Чистовая отделка", item: URL },
            ],
          }),
        },
      ],
    };
  },
  component: () => <RepairServicePage slug={SLUG} />,
});
