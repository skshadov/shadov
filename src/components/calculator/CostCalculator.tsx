/**
 * Подэтап 2.5.3 — главный компонент калькулятора. Состояние сохраняется в
 * localStorage по versioned-ключу. Персональные данные не сохраняются.
 */
import { useEffect, useMemo, useState } from "react";
import { CALCULATOR_MODES, CALCULATOR_LOCAL_STORAGE_KEY } from "@/types/calculator";
import type {
  CalculatorInput,
  CalculatorMode,
  CalculatorLineInput,
  HouseCompletionLevel,
} from "@/types/calculator";
import type { PriceCategory } from "@/types/pricing";
import { ALL_PRICE_CATEGORIES } from "@/types/pricing";
import { calculate } from "@/lib/calculator-engine";
import { CALCULATOR_MODE_SPECS, HOUSE_COMPLETION_LEVELS_SPEC } from "@/data/calculator-specification";
import { CalculatorModeSelector } from "./CalculatorModeSelector";
import { CalculatorInputs } from "./CalculatorInputs";
import { CalculatorPriceItems } from "./CalculatorPriceItems";
import { CalculatorSummary } from "./CalculatorSummary";
import { CalculatorWarnings } from "./CalculatorWarnings";
import { CalculatorDisclaimer } from "./CalculatorDisclaimer";
import { Button } from "@/components/ui/button";

interface Props {
  initialMode?: CalculatorMode;
  initialCategory?: PriceCategory;
}

function loadSnapshot(): Partial<CalculatorInput> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CALCULATOR_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Partial<CalculatorInput>;
  } catch {
    return null;
  }
}

function saveSnapshot(input: CalculatorInput) {
  if (typeof window === "undefined") return;
  try {
    const safe: CalculatorInput = {
      mode: input.mode,
      area: input.area,
      packageId: input.packageId,
      completionLevel: input.completionLevel,
      technologySlug: input.technologySlug,
      lines: input.lines,
    };
    window.localStorage.setItem(CALCULATOR_LOCAL_STORAGE_KEY, JSON.stringify(safe));
  } catch { /* ignore quota errors */ }
}

function isValidMode(v: unknown): v is CalculatorMode {
  return typeof v === "string" && (CALCULATOR_MODES as string[]).includes(v);
}

function isValidCategory(v: unknown): v is PriceCategory {
  return typeof v === "string" && (ALL_PRICE_CATEGORIES as string[]).includes(v);
}

/** Если у пользователя выбран дом — добавляет автостроку под уровень готовности. */
function houseLinesFor(input: CalculatorInput): CalculatorLineInput[] {
  if (input.mode !== "house" || !input.technologySlug || !input.completionLevel || !input.area) {
    return input.lines;
  }
  const level = HOUSE_COMPLETION_LEVELS_SPEC.find((l) => l.id === input.completionLevel);
  if (!level) return input.lines;
  const id = `${level.category}-${input.technologySlug}-${level.idSuffix}`;
  // Не дублируем, если пользователь уже добавил позицию вручную.
  const exists = input.lines.some((l) => l.id === id);
  if (exists) return input.lines;
  return [{ id, volume: input.area }, ...input.lines];
}

export function CostCalculator({ initialMode, initialCategory }: Props) {
  const [input, setInput] = useState<CalculatorInput>(() => {
    const snapshot = loadSnapshot();
    const fromQuery: CalculatorMode | undefined = isValidMode(initialMode) ? initialMode : undefined;
    return {
      mode: fromQuery ?? (isValidMode(snapshot?.mode) ? snapshot!.mode! : "repair"),
      area: snapshot?.area,
      packageId: snapshot?.packageId,
      completionLevel: snapshot?.completionLevel,
      technologySlug: snapshot?.technologySlug,
      lines: Array.isArray(snapshot?.lines) ? (snapshot!.lines as CalculatorLineInput[]) : [],
    };
  });

  useEffect(() => { saveSnapshot(input); }, [input]);

  const preselectedCategory: PriceCategory | undefined = isValidCategory(initialCategory) ? initialCategory : undefined;

  const lines = useMemo(() => houseLinesFor(input), [input]);
  const result = useMemo(
    () => calculate({ ...input, lines }),
    [input, lines],
  );

  const handlePatch = (patch: Partial<CalculatorInput>) =>
    setInput((prev) => ({ ...prev, ...patch }));

  const handleMode = (mode: CalculatorMode) =>
    setInput((prev) => ({
      mode,
      area: prev.area,
      lines: [],
    }));

  const handleClear = () => {
    setInput({ mode: input.mode, lines: [] });
    if (typeof window !== "undefined") {
      try { window.localStorage.removeItem(CALCULATOR_LOCAL_STORAGE_KEY); } catch { /* ignore */ }
    }
  };

  const spec = CALCULATOR_MODE_SPECS.find((m) => m.id === input.mode);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="grid gap-6">
        <CalculatorModeSelector value={input.mode} onChange={handleMode} />
        <CalculatorInputs
          mode={input.mode}
          area={input.area}
          technologySlug={input.technologySlug}
          completionLevel={input.completionLevel}
          onChange={handlePatch}
        />
        <CalculatorPriceItems
          mode={input.mode}
          preselectedCategory={preselectedCategory}
          lines={input.lines}
          onChange={(next) => setInput((prev) => ({ ...prev, lines: next }))}
        />
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={handleClear} className="min-h-11">
            Очистить расчёт
          </Button>
        </div>
      </div>
      <div className="grid gap-6">
        <CalculatorSummary result={result} />
        <CalculatorWarnings warnings={result.warnings} />
        <CalculatorDisclaimer mode={input.mode} />
        {spec ? (
          <section className="rounded-xl border border-border bg-card p-5 text-sm">
            <h2 className="font-display text-base font-semibold">Запрещённые автоматические расчёты</h2>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {spec.forbiddenAutoCalculations.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
