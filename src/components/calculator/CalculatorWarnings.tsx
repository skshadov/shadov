/**
 * Подэтап 2.5.3 — блок предупреждений калькулятора. Не передаёт информацию
 * только цветом: каждый код предупреждения сопровождается текстом и иконкой.
 */
import { AlertTriangle } from "lucide-react";
import type { CalculatorWarning } from "@/types/calculator";

export function CalculatorWarnings({ warnings }: { warnings: CalculatorWarning[] }) {
  if (warnings.length === 0) return null;
  // Дедупликация по сообщению — повторы не выводим.
  const seen = new Set<string>();
  const uniq = warnings.filter((w) => {
    if (seen.has(w.message)) return false;
    seen.add(w.message);
    return true;
  });
  return (
    <section
      aria-labelledby="calc-warnings-heading"
      className="rounded-xl border border-amber-300 bg-amber-50 p-5"
    >
      <h2 id="calc-warnings-heading" className="flex items-center gap-2 font-display text-base font-semibold text-amber-900">
        <AlertTriangle aria-hidden="true" className="h-4 w-4" />
        Проверьте состав расчёта
      </h2>
      <ul className="mt-3 space-y-2 text-sm text-amber-900">
        {uniq.map((w, i) => (
          <li key={`${w.code}-${i}`}>• {w.message}</li>
        ))}
      </ul>
    </section>
  );
}
