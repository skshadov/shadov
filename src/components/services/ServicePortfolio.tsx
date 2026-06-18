import { EmptyPortfolioState } from "@/components/content/EmptyPortfolioState";

export function ServicePortfolio() {
  return (
    <section className="border-b border-border py-10">
      <div className="container-page">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Примеры выполненных объектов</h2>
        <div className="mt-6"><EmptyPortfolioState /></div>
      </div>
    </section>
  );
}
