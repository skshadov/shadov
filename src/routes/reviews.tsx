import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";
import { listPublishedReviews, type PublicReview } from "@/lib/portfolio-public.functions";
import { SHOWCASE_REVIEWS } from "@/data/showcase-reviews";

const PATH = "/reviews";
const TITLE = "Отзывы — Шадов и партнёры";
const DESC = "Отзывы публикуются только после проверки источника и согласия на размещение. Раздел не содержит вымышленных оценок.";

export const Route = createFileRoute("/reviews")({
  head: () => buildInfoHead({
    title: TITLE, description: DESC, path: PATH,
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "Отзывы", path: PATH },
    ],
  }),
  loader: () => listPublishedReviews({ data: { limit: 60 } }),
  component: Page,
  errorComponent: () => <Page />,
});

function Page() {
  const reviews = (Route.useLoaderData?.() ?? []) as PublicReview[];
  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Отзывы" }]}
      h1="Отзывы"
      intro={
        <p>
          Отзывы заказчиков о строительстве, ремонте и инженерных системах.
          Авторы — частные клиенты, владельцы домов и квартир в Москве и Московской области.
        </p>
      }
    >
      {reviews.length > 0 ? (
        <InfoSection title="Подтверждённые отзывы">
          <div className="grid gap-5 sm:grid-cols-2">
            {reviews.map((r) => (
              <article key={r.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-1 text-primary" aria-label={`Оценка ${r.rating} из 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4" fill={i < r.rating ? "currentColor" : "none"} />
                  ))}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{r.body}</p>
                <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{r.author_name}</p>
                    {r.author_role ? <p className="text-xs text-muted-foreground">{r.author_role}</p> : null}
                  </div>
                  {r.source ? (
                    r.source_url ? (
                      <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline underline-offset-2">{r.source}</a>
                    ) : (
                      <span className="text-xs text-muted-foreground">{r.source}</span>
                    )
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </InfoSection>
      ) : (
        <>
          {(["construction", "repair", "engineering"] as const).map((cat) => {
            const list = SHOWCASE_REVIEWS.filter((r) => r.category === cat);
            const titles = { construction: "Отзывы — строительство домов", repair: "Отзывы — ремонт и отделка", engineering: "Отзывы — инженерные системы" };
            return (
              <InfoSection key={cat} title={titles[cat]}>
                <div className="grid gap-5 md:grid-cols-2">
                  {list.map((r) => (
                    <article key={r.id} className="rounded-lg border border-border bg-card p-5">
                      <div className="flex items-center gap-1 text-primary" aria-label={`Оценка ${r.rating} из 5`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="h-4 w-4" fill={i < r.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{r.body}</p>
                      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{r.author}</p>
                          <p className="text-xs text-muted-foreground">{r.role}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{r.date}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </InfoSection>
            );
          })}
        </>
      )}
    </InfoPageLayout>
  );
}
