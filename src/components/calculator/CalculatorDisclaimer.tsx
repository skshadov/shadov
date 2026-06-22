/**
 * Подэтап 2.5.3 — дисклеймеры калькулятора. Используются на странице
 * /kalkulyator-stoimosti и не должны дублировать общий PriceDisclaimer.
 */
import {
  CALCULATOR_DISCLAIMERS,
  HOUSE_CALCULATOR_DISCLAIMER,
} from "@/data/calculator-specification";
import type { CalculatorMode } from "@/types/calculator";

export function CalculatorDisclaimer({ mode }: { mode: CalculatorMode }) {
  return (
    <section
      aria-labelledby="calc-disclaimer-heading"
      className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground"
    >
      <h2 id="calc-disclaimer-heading" className="font-display text-base font-semibold text-foreground">
        Условия предварительного расчёта
      </h2>
      <ul className="mt-3 space-y-2">
        {CALCULATOR_DISCLAIMERS.map((d) => (
          <li key={d}>• {d}</li>
        ))}
        {mode === "house" ? <li>• {HOUSE_CALCULATOR_DISCLAIMER}</li> : null}
      </ul>
    </section>
  );
}
