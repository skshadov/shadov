import { Breadcrumbs, type BreadcrumbItem } from "@/components/common/Breadcrumbs";

interface ServiceHeroProps {
  breadcrumbs: BreadcrumbItem[];
  h1: string;
  description: string;
  startingPrice?: string;
}

export function ServiceHero({ breadcrumbs, h1, description, startingPrice }: ServiceHeroProps) {
  return (
    <section className="border-b border-border bg-background">
      <div className="container-page py-10 md:py-14">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">{h1}</h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">{description}</p>
        {startingPrice ? (
          <p className="mt-4 inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-primary">
            Стартовая цена: {startingPrice}
          </p>
        ) : null}
      </div>
    </section>
  );
}
