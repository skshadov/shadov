/**
 * §12.9 ТЗ — отзывы тянем из БД; пока пусто — честный плейсхолдер.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/common/SectionHeading";
import { PlaceholderNotice } from "@/components/common/PlaceholderNotice";
import { listPublishedReviews } from "@/lib/portfolio-public.functions";

export function ReviewsPreview() {
  const fetchReviews = useServerFn(listPublishedReviews);
  const { data, isLoading } = useQuery({
    queryKey: ["reviews", "preview"],
    queryFn: () => fetchReviews({ data: { limit: 6 } }),
    staleTime: 5 * 60_000,
  });
  const reviews = data ?? [];

  return (
    <section className="border-b border-border bg-background">
      <div className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow="Отзывы"
          title="Только реальные отзывы реальных заказчиков"
          description="Публикуем только подтверждённые отзывы — после проверки источника и согласия автора."
        />
        <div className="mt-10">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-lg border border-border bg-card/40" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <PlaceholderNotice
              title="Раздел наполняется подтверждёнными отзывами заказчиков"
              description="Мы не размещаем вымышленные отзывы и не покупаем «накрутку» рейтингов."
              action={
                <Button asChild variant="outline">
                  <Link to="/reviews">Раздел «Отзывы»</Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {reviews.map((r) => (
                  <article key={r.id} className="rounded-lg border border-border bg-card p-5">
                    <div className="flex items-center gap-1 text-primary" aria-label={`Оценка ${r.rating} из 5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4" fill={i < r.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <p className="mt-3 line-clamp-5 text-sm leading-relaxed">{r.body}</p>
                    <p className="mt-4 text-sm font-semibold">{r.author_name}</p>
                    {r.author_role ? (
                      <p className="text-xs text-muted-foreground">{r.author_role}</p>
                    ) : null}
                  </article>
                ))}
              </div>
              <div className="mt-8">
                <Button asChild variant="outline">
                  <Link to="/reviews">Все отзывы</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}