/**
 * Подэтап 2.5.3 — CTA «Рассчитать предварительную стоимость», встраивается
 * на 15 страницах услуг. Передаёт режим (и при наличии — категорию)
 * через query-параметры. Не подключается к заглушкам.
 */
import { Link } from "@tanstack/react-router";
import { Calculator } from "lucide-react";
import { CALCULATOR_LINKS_FROM_SERVICES, CALCULATOR_ROUTE } from "@/data/calculator-specification";
import { Button } from "@/components/ui/button";

export function CalculatorCta({ slug }: { slug: string }) {
  const entry = CALCULATOR_LINKS_FROM_SERVICES.find((l) => l.slug === slug);
  if (!entry) return null;
  const search: Record<string, string> = { mode: entry.mode };
  if (entry.category) search.category = entry.category;
  return (
    <section
      aria-labelledby="calculator-cta-heading"
      className="border-b border-border surface-light"
    >
      <div className="container-page py-10">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 id="calculator-cta-heading" className="font-display text-xl font-semibold">
            Калькулятор предварительной стоимости
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Откройте калькулятор с предустановленным режимом, добавьте
            позиции из прайса и введите объёмы в их фактических единицах.
            Расчёт является предварительным и не заменяет смету.
          </p>
          <div className="mt-4">
            <Button asChild className="min-h-11">
              <Link to={CALCULATOR_ROUTE} search={search}>
                <Calculator aria-hidden="true" className="mr-2 h-4 w-4" />
                Рассчитать предварительную стоимость
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
