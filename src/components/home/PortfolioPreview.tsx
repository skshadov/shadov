/**
 * §12.6 ТЗ — реальные объекты подтягиваются из БД; пока пусто, показываем
 * честный плейсхолдер.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/common/SectionHeading";
import { listPublishedPortfolioProjects } from "@/lib/portfolio-public.functions";
import { SHOWCASE_PROJECTS } from "@/data/showcase-projects";

/** Берём по одному объекту из каждого направления, чтобы на главной было разнообразие. */
function pickDiverse(limit: number) {
  const byTag = new Map<string, typeof SHOWCASE_PROJECTS>();
  for (const p of SHOWCASE_PROJECTS) {
    const list = byTag.get(p.tag) ?? [];
    list.push(p);
    byTag.set(p.tag, list);
  }
  const groups = [...byTag.values()];
  const out: typeof SHOWCASE_PROJECTS = [];
  for (let round = 0; out.length < limit; round++) {
    let added = false;
    for (const g of groups) {
      const item = g[round];
      if (!item) continue;
      out.push(item);
      added = true;
      if (out.length === limit) break;
    }
    if (!added) break;
  }
  return out;
}

const SHOWCASE = pickDiverse(6).map((p) => ({
  src: p.image,
  category: p.tag,
  title: p.title,
  location: p.location,
}));

export function PortfolioPreview() {
  const fetchProjects = useServerFn(listPublishedPortfolioProjects);
  const { data, isLoading } = useQuery({
    queryKey: ["portfolio", "preview"],
    queryFn: () => fetchProjects({ data: { limit: 6 } }),
    staleTime: 5 * 60_000,
  });
  const projects = data ?? [];

  return (
    <section className="border-b border-border bg-background">
      <div className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow="Наши работы"
          title="Реальные объекты с подтверждённой информацией"
          description="Сданные объекты по штукатурке, стяжке, тёплому полу и черновой инженерии — с согласия заказчика, без выдуманных кейсов."
        />
        <div className="mt-10">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-56 animate-pulse rounded-lg border border-border bg-card/40" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {SHOWCASE.map((p) => (
                  <div
                    key={p.title}
                    className="group overflow-hidden rounded-lg border border-border bg-card"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={p.src}
                        alt={p.title}
                        loading="lazy"
                        width={1280}
                        height={960}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.category}</p>
                      <h3 className="mt-1 line-clamp-2 text-base font-semibold">{p.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{p.location}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button asChild variant="outline">
                  <Link to="/portfolio">Все объекты</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    to="/portfolio/$slug"
                    params={{ slug: p.slug }}
                    className="group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-foreground/40"
                  >
                    {p.cover_url ? (
                      <div className="aspect-[4/3] overflow-hidden bg-muted">
                        <img
                          src={p.cover_url}
                          alt={p.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : null}
                    <div className="p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.category}</p>
                      <h3 className="mt-1 line-clamp-2 text-base font-semibold">{p.title}</h3>
                      {p.location ? (
                        <p className="mt-1 text-sm text-muted-foreground">{p.location}</p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-8">
                <Button asChild variant="outline">
                  <Link to="/portfolio">Все объекты</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}