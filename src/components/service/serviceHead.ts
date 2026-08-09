import type { ServicePricing } from "@/data/pricing/types";

const ORIGIN = "https://shadov.pro";

export function buildServiceHead(data: ServicePricing) {
  const url = `${ORIGIN}${data.path}`;
  return {
    meta: [
      { title: data.metaTitle },
      { name: "description", content: data.metaDescription },
      { property: "og:title", content: data.metaTitle },
      { property: "og:description", content: data.metaDescription },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: data.metaTitle },
      { name: "twitter:description", content: data.metaDescription },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Главная", item: `${ORIGIN}/` },
            { "@type": "ListItem", position: 2, name: "Цены", item: `${ORIGIN}/prices` },
            { "@type": "ListItem", position: 3, name: data.shortName, item: url },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: data.h1,
          description: data.metaDescription,
          areaServed: "Москва и Московская область",
          provider: { "@type": "Organization", name: "Шадов и партнёры", url: ORIGIN },
          url,
          offers: {
            "@type": "Offer",
            priceCurrency: "RUB",
            description: data.priceHeadline,
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: data.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  };
}