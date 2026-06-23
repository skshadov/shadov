import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReviewsByCategory } from "@/data/showcase-reviews";
import type { ServiceCategory } from "@/types/services";

interface ServiceReviewsProps {
  category?: ServiceCategory;
  limit?: number;
}

export function ServiceReviews({ category, limit = 10 }: ServiceReviewsProps) {
  const items = category ? getReviewsByCategory(category, limit) : [];
  return (
    <section className="border-b border-border py-10">
      <div className="container-page">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Отзывы по направлению
        </h2>
        {items.length > 0 ? (
          <>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {items.map((r) => (
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
            <div className="mt-8">
              <Button asChild variant="outline">
                <Link to="/reviews">Все отзывы</Link>
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
