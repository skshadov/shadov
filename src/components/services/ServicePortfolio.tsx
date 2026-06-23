import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getShowcaseByCategory } from "@/data/showcase-projects";
import type { ServiceCategory } from "@/types/services";

interface ServicePortfolioProps {
  category?: ServiceCategory;
  limit?: number;
}

export function ServicePortfolio({ category, limit = 6 }: ServicePortfolioProps) {
  const items = category ? getShowcaseByCategory(category, limit) : [];
  return (
    <section className="border-b border-border py-10">
      <div className="container-page">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Примеры выполненных объектов
        </h2>
        {items.length > 0 ? (
          <>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <article key={p.id} className="group overflow-hidden rounded-lg border border-border bg-card">
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      width={1280}
                      height={960}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.tag}</p>
                    <h3 className="mt-1 line-clamp-2 text-base font-semibold">{p.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{p.location}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {p.area !== "—" ? `${p.area} · ` : ""}
                      {p.year}
                    </p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-8">
              <Button asChild variant="outline">
                <Link to="/portfolio">Смотреть все объекты</Link>
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
