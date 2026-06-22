/**
 * Подэтап 2.5.3 — переключатель режимов калькулятора.
 * Доступен с клавиатуры, использует радио-семантику и aria-checked.
 */
import { CALCULATOR_MODE_SPECS } from "@/data/calculator-specification";
import type { CalculatorMode } from "@/types/calculator";

interface Props {
  value: CalculatorMode;
  onChange: (mode: CalculatorMode) => void;
}

export function CalculatorModeSelector({ value, onChange }: Props) {
  return (
    <fieldset className="rounded-xl border border-border bg-card p-5">
      <legend className="px-2 text-sm font-semibold">Выбор режима расчёта</legend>
      <div
        role="radiogroup"
        aria-label="Режим калькулятора"
        className="mt-3 grid gap-2 sm:grid-cols-2"
      >
        {CALCULATOR_MODE_SPECS.map((m) => {
          const selected = value === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(m.id)}
              className={`flex min-h-11 flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background hover:border-foreground/40"
              }`}
            >
              <span className="font-medium">{m.label}</span>
              <span className={`text-xs ${selected ? "text-background/80" : "text-muted-foreground"}`}>
                {m.description}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
