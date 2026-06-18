import { EmptyReviewsState } from "@/components/content/EmptyReviewsState";

export function ServiceReviews() {
  return (
    <section className="border-b border-border py-10">
      <div className="container-page">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Отзывы по направлению</h2>
        <div className="mt-6"><EmptyReviewsState /></div>
      </div>
    </section>
  );
}
