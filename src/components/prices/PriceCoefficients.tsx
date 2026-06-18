/**
 * Подэтап 2.1 — таблица утверждённых коэффициентов калькулятора.
 */
import { CALCULATOR_RULES } from "@/data/calculator-rules";

function formatCoefficient(min?: number, max?: number): string {
  if (min === undefined) return "Рассчитывается индивидуально";
  const toPct = (k: number) => `${Math.round((k - 1) * 100)}%`;
  if (max && max > min) return `+${toPct(min)}–${toPct(max)}`;
  return `+${toPct(min)}`;
}

export function PriceCoefficients() {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[480px] text-left text-sm">
        <caption className="sr-only">Коэффициенты к стоимости работ</caption>
        <thead className="bg-[color:var(--surface-medium)] text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">Условие</th>
            <th scope="col" className="px-4 py-3">Коэффициент</th>
          </tr>
        </thead>
        <tbody>
          {CALCULATOR_RULES.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <th scope="row" className="px-4 py-3 font-medium">{r.label}</th>
              <td className="px-4 py-3 text-muted-foreground">
                {r.individualCalculation ? "Рассчитывается индивидуально" : formatCoefficient(r.minCoefficient, r.maxCoefficient)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
