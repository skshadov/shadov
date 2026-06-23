/**
 * Подэтап 2.5.3 — итог калькулятора. Итог объявлен aria-live="polite"
 * (не вырывает фокус), таблица имеет caption/thead/scope.
 */
import { Link } from "@tanstack/react-router";
import { formatRubles } from "@/lib/format-price";
import type { CalculatorResult, CalculatorMode } from "@/types/calculator";

const MODE_LABELS: Record<CalculatorMode, string> = {
  repair: "Ремонт",
  house: "Строительство частного дома",
  construction: "Отдельные строительные работы",
  engineering: "Инженерные системы",
};

function unitDisplay(unit: string, unitLabel?: string) {
  return unitLabel ?? unit;
}

export function CalculatorSummary({ result }: { result: CalculatorResult }) {
  const okLines = result.lines.filter((l) => l.status === "ok");
  return (
    <section
      aria-labelledby="calc-summary-heading"
      className="rounded-xl border border-border bg-card p-5"
    >
      <h2 id="calc-summary-heading" className="font-display text-lg font-semibold">
        Предварительный расчёт — {MODE_LABELS[result.mode]}
      </h2>

      <div className="mt-4 overflow-x-auto min-h-11" tabIndex={0} aria-label="Прокручиваемые статьи расчёта">
        <table className="min-w-full text-sm">
          <caption className="text-left text-xs text-muted-foreground">
            Постатейный предварительный расчёт по утверждённому прайсу
          </caption>
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="py-2 pr-3">Название</th>
              <th scope="col" className="py-2 pr-3">Объём</th>
              <th scope="col" className="py-2 pr-3">Цена за единицу</th>
              <th scope="col" className="py-2 pr-3 text-right">Стоимость</th>
            </tr>
          </thead>
          <tbody>
            {okLines.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-3 text-muted-foreground">
                  Добавьте позиции и введите объёмы для предварительного расчёта.
                </td>
              </tr>
            ) : (
              okLines.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="py-2 pr-3">{l.name}</td>
                  <td className="py-2 pr-3">
                    {typeof l.volume === "number"
                      ? `${l.volume} ${unitDisplay(l.unit, l.unitLabel)}`
                      : typeof l.smetaBase === "number"
                      ? `СМР ${formatRubles(l.smetaBase)}`
                      : "—"}
                  </td>
                  <td className="py-2 pr-3">
                    {typeof l.unitPrice === "number"
                      ? `${formatRubles(l.unitPrice)} / ${unitDisplay(l.unit, l.unitLabel)}`
                      : typeof l.percent === "number"
                      ? `${l.percent}%`
                      : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right font-medium">
                    {typeof l.cost === "number" && l.cost > 0 ? formatRubles(l.cost) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p
        aria-live="polite"
        aria-atomic="true"
        className="mt-5 flex items-baseline justify-between gap-3 rounded-lg bg-muted px-4 py-3"
      >
        <span className="text-sm font-medium">Предварительный итог</span>
        <span className="text-xl font-semibold tabular-nums">
          {result.subtotal > 0 ? formatRubles(result.subtotal) : "—"}
        </span>
      </p>

      {result.byProject.length > 0 ? (
        <div className="mt-5">
          <h3 className="font-display text-sm font-semibold">Требуют расчёта по проекту</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {result.byProject.map((l) => (
              <li key={l.id}>• {l.name}: стоимость рассчитывается по проекту</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-5 text-sm">
        <Link to="/prices" className="underline">
          Полный прайс — /prices
        </Link>
      </p>
    </section>
  );
}
