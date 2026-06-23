/**
 * Подэтап 2.1 — честный empty state для отзывов (§15 запроса).
 */
export function EmptyReviewsState() {
  return (
    <section className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
      <p className="text-base font-semibold">Отзывы заказчиков скоро будут опубликованы.</p>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Отзыв публикуется только после проверки источника и согласия на размещение.
      </p>
    </section>
  );
}
