/**
 * Подэтап 2.1 — честный empty state для портфолио (§14 запроса).
 */
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function EmptyPortfolioState() {
  return (
    <section className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
      <p className="text-base font-semibold">Портфолио объектов скоро будет опубликовано.</p>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Здесь появятся реализованные объекты с фильтрами по направлению,
        технологии, площади и местоположению.
      </p>
      <div className="mt-5">
        <Button asChild>
          <Link to="/kalkulyator-stoimosti">Отправить проект на расчёт</Link>
        </Button>
      </div>
    </section>
  );
}
