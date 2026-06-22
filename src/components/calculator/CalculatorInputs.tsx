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

  return (
    <fieldset className="rounded-xl border border-border bg-card p-5">
      <legend className="px-2 text-sm font-semibold">Основные параметры</legend>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={areaId} className="text-sm font-medium">
            {mode === "house" ? "Площадь дома, м²" : "Площадь по полу, м²"}
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
            {mode === "house"
              ? "Используется только для расчёта позиций с единицей «м² площади дома»."
              : "Используется только для пакетных позиций с единицей «м²»."}
          </p>
        </div>

        {mode === "house" ? (
          <>
            <div>
              <label htmlFor={techId} className="text-sm font-medium">
                Технология дома
              </label>
              <select
                id={techId}
                value={technologySlug ?? ""}
                onChange={(e) => onChange({ technologySlug: e.target.value || undefined })}
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Не выбрано</option>
                {HOUSE_TECHNOLOGIES.map((t) => (
                  <option key={t.slug} value={t.slug}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={levelId} className="text-sm font-medium">
                Уровень готовности
              </label>
              <select
                id={levelId}
                value={completionLevel ?? ""}
                onChange={(e) => onChange({ completionLevel: (e.target.value || undefined) as HouseCompletionLevel | undefined })}
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Не выбрано</option>
                {HOUSE_COMPLETION_LEVELS_SPEC.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            </div>
          </>
        ) : null}
      </div>
    </fieldset>
  );
}
