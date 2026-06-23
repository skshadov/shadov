import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";
import { Button } from "@/components/ui/button";
import { listPublishedPortfolioProjects, type PortfolioProjectListItem } from "@/lib/portfolio-public.functions";
import { SHOWCASE_PROJECTS } from "@/data/showcase-projects";

const PATH = "/portfolio";
const TITLE = "Наши работы — Шадов и партнёры";
const DESC = "Раздел наполняется подтверждёнными материалами выполненных объектов. Фотографии и описание публикуются только после проверки и согласия на размещение.";

export const Route = createFileRoute("/portfolio")({
  head: () => buildInfoHead({
    title: TITLE, description: DESC, path: PATH,
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "Наши работы", path: PATH },
    ],
  }),
  loader: () => listPublishedPortfolioProjects({ data: { limit: 60 } }),
  component: Page,
  errorComponent: () => <Page />,
});

function Page() {
  const projects = (Route.useLoaderData?.() ?? []) as PortfolioProjectListItem[];
  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Наши работы" }]}
      h1="Наши работы"
      intro={
        <p>
          Реализованные объекты в Москве и Московской области:
          строительство загородных домов, ремонт квартир, инженерные системы.
          Ниже — подборка сданных работ с фотографиями, площадью и сроком завершения.
        </p>
      }
    >
      {projects.length > 0 ? (
        <InfoSection title="Сданные объекты">
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
                    <img src={p.cover_url} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                ) : null}
                <div className="p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.category}</p>
                  <h3 className="mt-1 line-clamp-2 text-base font-semibold">{p.title}</h3>
                  {p.location ? <p className="mt-1 text-sm text-muted-foreground">{p.location}</p> : null}
                  {(p.area_m2 || p.year_completed) ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {p.area_m2 ? `${p.area_m2} м²` : null}
                      {p.area_m2 && p.year_completed ? " · " : ""}
                      {p.year_completed ? `${p.year_completed}` : null}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </InfoSection>
      ) : (
      <>
        {(["construction", "repair", "engineering"] as const).map((cat) => {
          const list = SHOWCASE_PROJECTS.filter((p) => p.category === cat);
          const titles = { construction: "Строительство домов", repair: "Ремонт и отделка", engineering: "Инженерные системы" };
          return (
            <InfoSection key={cat} title={titles[cat]}>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((p) => (
                  <article key={p.id} className="group overflow-hidden rounded-lg border border-border bg-card">
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <img src={p.image} alt={p.title} loading="lazy" width={1280} height={960} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.tag}</p>
                      <h3 className="mt-1 line-clamp-2 text-base font-semibold">{p.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{p.location}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {p.area !== "—" ? `${p.area} · ` : ""}{p.year}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </InfoSection>
          );
        })}
        <InfoSection title="Хотите такой же объект?">
          <div className="flex flex-wrap gap-3">
            <Button asChild className="min-h-11">
              <Link to="/kalkulyator-stoimosti">Открыть калькулятор</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/contacts">Оставить заявку на расчёт</Link>
            </Button>
          </div>
        </InfoSection>
      </>
      )}
    </InfoPageLayout>
  );
}
