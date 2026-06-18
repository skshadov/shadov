/**
 * §12.3 ТЗ — стартовые цены. Значения и порядок — дословные из
 * уточнения 5 пользователя. PriceDisclaimer обязателен.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { PriceDisclaimer } from "@/components/common/PriceDisclaimer";
import { HOME_STARTING_PRICES } from "@/data/home-prices";
import { Button } from "@/components/ui/button";

export function StartingPrices() {
  return (
    <section id="prices" className="border-b border-border bg-background">
      <div className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow="Стартовые цены"
          title="С чего начинается бюджет"
          description="Шесть базовых ориентиров для предварительной оценки. Точную стоимость по вашему объекту посчитаем после обследования и сметы."
        />
        <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_STARTING_PRICES.map((p) => (
            <li key={p.service}>
              <Link
                to={p.to}
                className="flex h-full flex-col justify-between gap-3 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/60"
              >
                <div>
                  <p className="font-display text-base font-semibold leading-tight">{p.service}</p>
                  <p className="mt-2 text-2xl font-semibold text-primary">{p.price}</p>
                </div>
                <span className="inline-flex items-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Подробнее
                  <ArrowRight aria-hidden="true" className="ml-1 h-3 w-3" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <PriceDisclaimer />
          <Button asChild variant="outline">
            <Link to="/prices">Полный прайс по разделам</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}