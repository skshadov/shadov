import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection } from "@/components/info/InfoPageLayout";
import { Button } from "@/components/ui/button";
import { getPublishedPortfolioProject, type PortfolioProjectDetail } from "@/lib/portfolio-public.functions";

export const Route = createFileRoute("/portfolio/$slug")({
  head: ({ loaderData }) => {
    const p = loaderData as PortfolioProjectDetail | undefined;
    if (!p) {
      return {
        meta: [
          { title: "Объект не найден — Шадов и партнёры" },
          { name: "robots", content: "noindex, follow" },
          { name: "description", content: "Раздел портфолио наполняется подтверждёнными материалами выполненных объектов." },
        ],
      };
    }
    const title = `${p.title} — Шадов и партнёры`;
    const desc = p.summary;
    const img = p.cover_url ?? undefined;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        ...(img ? [{ property: "og:image", content: img } as const, { name: "twitter:image", content: img } as const] : []),
      ],
      links: [{ rel: "canonical", href: `/portfolio/${p.slug}` }],
    };
  },
  loader: async ({ params }) => {
    const p = await getPublishedPortfolioProject({ data: { slug: params.slug } });
    if (!p) throw notFound();
    return p;
  },
  component: ProjectPage,
  notFoundComponent: () => (
    <InfoPageLayout
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Наши работы", to: "/portfolio" },
        { label: "Объект не найден" },
      ]}
      h1="Объект не найден"
      intro={<p>Раздел портфолио наполняется подтверждёнными материалами выполненных объектов.</p>}
    >
      <InfoSection>
        <p>
          У нас пока нет публикуемых данных по этому идентификатору. Перейдите
          к списку направлений или откройте калькулятор предварительной стоимости.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="min-h-11">
            <Link to="/portfolio">Перейти в «Наши работы»</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/kalkulyator-stoimosti">Открыть калькулятор</Link>
          </Button>
        </div>
      </InfoSection>
    </InfoPageLayout>
  ),
  errorComponent: ({ error }) => (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Наши работы", to: "/portfolio" }, { label: "Ошибка" }]}
      h1="Не удалось загрузить объект"
      intro={<p>{(error as Error)?.message ?? "Попробуйте обновить страницу."}</p>}
    >
      <InfoSection>
        <Button asChild><Link to="/portfolio">К списку</Link></Button>
      </InfoSection>
    </InfoPageLayout>
  ),
});

function ProjectPage() {
  const p = Route.useLoaderData() as PortfolioProjectDetail;
  return (
    <InfoPageLayout
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Наши работы", to: "/portfolio" },
        { label: p.title },
      ]}
      h1={p.title}
      intro={<p>{p.summary}</p>}
    >
      {p.cover_url ? (
        <div className="overflow-hidden rounded-lg border border-border bg-muted">
          <img src={p.cover_url} alt={p.title} className="h-auto w-full object-cover" />
        </div>
      ) : null}

      <InfoSection title="Параметры объекта">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Направление" value={p.category} />
          {p.location ? <Meta label="Адрес" value={p.location} /> : null}
          {p.area_m2 ? <Meta label="Площадь" value={`${p.area_m2} м²`} /> : null}
          {p.duration_months ? <Meta label="Срок" value={`${p.duration_months} мес.`} /> : null}
          {p.year_completed ? <Meta label="Год сдачи" value={String(p.year_completed)} /> : null}
        </dl>
      </InfoSection>

      {p.description ? (
        <InfoSection title="Описание">
          <div className="prose prose-sm max-w-none whitespace-pre-wrap dark:prose-invert">{p.description}</div>
        </InfoSection>
      ) : null}

      {p.gallery.length > 0 ? (
        <InfoSection title="Галерея">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {p.gallery.map((g, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-border bg-muted">
                <img src={g.url} alt={g.alt ?? p.title} loading="lazy" className="h-auto w-full object-cover" />
              </div>
            ))}
          </div>
        </InfoSection>
      ) : null}

      <InfoSection>
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link to="/kalkulyator-stoimosti">Рассчитать похожий объект</Link></Button>
          <Button asChild variant="outline"><Link to="/portfolio">Все объекты</Link></Button>
        </div>
      </InfoSection>
    </InfoPageLayout>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}
