/**
 * Подэтап 2.6 — единый каркас наполненных информационных и юридических
 * страниц. Использует общие Header/Footer, breadcrumbs и контейнерные
 * отступы. Не вводит вымышленных данных и не подключает backend.
 */
import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/common/Breadcrumbs";

interface InfoPageLayoutProps {
  breadcrumbs: BreadcrumbItem[];
  h1: string;
  intro?: ReactNode;
  children: ReactNode;
}

export function InfoPageLayout({ breadcrumbs, h1, intro, children }: InfoPageLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex-1 surface-light">
        <div className="container-page py-10 md:py-16">
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <header className="max-w-3xl">
            <h1 className="font-display text-3xl font-semibold leading-tight text-balance sm:text-4xl md:text-[44px]">
              {h1}
            </h1>
            {intro ? (
              <div className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {intro}
              </div>
            ) : null}
          </header>
          <div className="mt-10 grid gap-8">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

interface InfoSectionProps {
  title?: string;
  children: ReactNode;
}
export function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 md:p-8">
      {title ? (
        <h2 className="font-display text-xl font-semibold text-foreground md:text-2xl">
          {title}
        </h2>
      ) : null}
      <div className={`${title ? "mt-4" : ""} space-y-3 text-base leading-relaxed text-foreground/90`}>
        {children}
      </div>
    </section>
  );
}

interface InfoListProps { items: string[] }
export function InfoList({ items }: InfoListProps) {
  return (
    <ul className="space-y-2 text-base leading-relaxed text-foreground/90">
      {items.map((it) => (
        <li key={it} className="flex gap-2">
          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Универсальный head() для информационных и юридических страниц.
 * Возвращает meta, canonical и BreadcrumbList JSON-LD. На юридические
 * страницы не добавляются Service/Offer/Review/AggregateRating.
 */
export function buildInfoHead(opts: {
  title: string;
  description: string;
  path: string;
  breadcrumbs: Array<{ name: string; path: string }>;
}) {
  const url = `https://shadov.pro${opts.path}`;
  return {
    meta: [
      { title: opts.title },
      { name: "description", content: opts.description },
      { property: "og:title", content: opts.title },
      { property: "og:description", content: opts.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: opts.breadcrumbs.map((b, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: b.name,
            item: `https://shadov.pro${b.path}`,
          })),
        }),
      },
    ],
  };
}
