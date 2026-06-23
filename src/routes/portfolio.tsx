import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";
import { PlaceholderNotice } from "@/components/common/PlaceholderNotice";
import { Button } from "@/components/ui/button";
import { listPublishedPortfolioProjects, type PortfolioProjectListItem } from "@/lib/portfolio-public.functions";

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
          Раздел наполняется подтверждёнными материалами выполненных объектов.
          Названия, адреса, площади, бюджеты и фотографии публикуются только
          после проверки материалов и получения разрешения на размещение.
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
      <InfoSection title="Раздел готовится">
        <PlaceholderNotice
          title="Раздел наполняется подтверждёнными материалами выполненных объектов"
          description="Фотографии, описание работ, сроки и характеристики объекта публикуются только после проверки материалов и получения разрешения на размещение."
        />
        <div className="flex flex-wrap gap-3">
          <Button asChild className="min-h-11">
            <Link to="/kalkulyator-stoimosti">Открыть калькулятор</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/contacts">Оставить заявку на расчёт</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Подробнее об услугах —{" "}
          <Link to="/stroitelstvo" className="text-primary underline underline-offset-2 hover:opacity-80">строительство</Link>
          {", "}
          <Link to="/remont" className="text-primary underline underline-offset-2 hover:opacity-80">ремонт</Link>
          {", "}
          <Link to="/inzhenernye-sistemy" className="text-primary underline underline-offset-2 hover:opacity-80">инженерные системы</Link>.
        </p>
      </InfoSection>
      )}
    </InfoPageLayout>
  );
}
