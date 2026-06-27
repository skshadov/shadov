/**
 * Подэтап 2.5.3 — основные параметры калькулятора (площадь, технология,
 * уровень готовности). Все поля имеют <label>, ошибки связаны через
 * aria-describedby.
 */
import { useId } from "react";
import { HOUSE_COMPLETION_LEVELS_SPEC } from "@/data/calculator-specification";
import { HOUSE_TECHNOLOGIES } from "@/data/house-technologies";
import type { CalculatorInput, CalculatorMode, HouseCompletionLevel } from "@/types/calculator";

interface Props {
  mode: CalculatorMode;
  area?: number;
  technologySlug?: string;
  completionLevel?: HouseCompletionLevel;
  onChange: (patch: Partial<CalculatorInput>) => void;
}

function sanitizeNumber(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

export function CalculatorInputs({ mode, area, technologySlug, completionLevel, onChange }: Props) {
  const areaId = useId();
  const areaHintId = useId();
  const techId = useId();
  const levelId = useId();

  if (mode === "construction") {
    return (
      <fieldset className="rounded-xl border border-border bg-card p-5">
        <legend className="px-2 text-sm font-semibold">Параметры</legend>
        <p className="mt-3 text-sm text-muted-foreground">
          Объёмы вводятся отдельно для каждой выбранной позиции в фактической
          единице прайса. Площадь дома и общую площадь объекта калькулятор не
          использует — это исключает автоматический расчёт объёма бетона,
          площади кровли и площади фасада.
        </p>
      </fieldset>
    );
  }

  // Для режимов «Ремонт» и «Строительство дома» площадь, технология и
  // уровень готовности больше не запрашиваются отдельно — пользователь
  // выбирает позиции и вводит объём прямо в списке позиций ниже. Это
  // убирает «второй расчёт» и путаницу.
  if (mode === "repair" || mode === "house") {
    return null;
  }

  return (
    <fieldset className="rounded-xl border border-border bg-card p-5">
      <legend className="px-2 text-sm font-semibold">Основные параметры</legend>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={areaId} className="text-sm font-medium">
            Площадь по полу, м²
          </label>
          <input
            id={areaId}
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={area ?? ""}
            onChange={(e) => onChange({ area: sanitizeNumber(e.target.value) })}
            aria-describedby={areaHintId}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p id={areaHintId} className="mt-1 text-xs text-muted-foreground">
            Используется только для пакетных позиций с единицей «м²».
          </p>
        </div>
      </div>
    </fieldset>
  );
}
