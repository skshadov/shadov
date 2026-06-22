/**
 * Подэтап 2.5.3 — выбор позиций и ввод объёмов. Категории и единицы
 * берутся напрямую из prices.ts, без переименований.
 */
import { useId, useMemo } from "react";
import { PRICES, getPriceById } from "@/data/prices";
import { PRICE_CATEGORY_LABELS } from "@/types/pricing";
import type { PriceCategory, PriceItem } from "@/types/pricing";
import type { CalculatorLineInput, CalculatorMode } from "@/types/calculator";
import { CALCULATOR_MODE_SPECS, BY_PROJECT_ITEM_IDS } from "@/data/calculator-specification";
import { formatRubles, getUnitDisplay } from "@/lib/format-price";
import { Trash2 } from "lucide-react";

interface Props {
  mode: CalculatorMode;
  preselectedCategory?: PriceCategory;
  lines: CalculatorLineInput[];
  onChange: (lines: CalculatorLineInput[]) => void;
}

function sanitizeNumber(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

export function CalculatorPriceItems({ mode, preselectedCategory, lines, onChange }: Props) {
  const spec = CALCULATOR_MODE_SPECS.find((m) => m.id === mode);
  const allowedCategories = useMemo(() => {
    if (!spec) return [] as PriceCategory[];
    if (preselectedCategory && spec.priceCategories.includes(preselectedCategory)) {
      return [preselectedCategory];
    }
    return spec.priceCategories;
  }, [spec, preselectedCategory]);

  const itemsByCategory = useMemo(() => {
    const out: Record<string, PriceItem[]> = {};
    for (const c of allowedCategories) {
      out[c] = PRICES.filter((p) => p.category === c).sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return out;
  }, [allowedCategories]);

  const addId = useId();

  const addLine = (id: string) => {
    if (!id) return;
    const item = getPriceById(id);
    if (!item) return;
    onChange([...lines, { id }]);
  };
  const removeLine = (index: number) =>
    onChange(lines.filter((_, i) => i !== index));
  const updateLine = (index: number, patch: Partial<CalculatorLineInput>) =>
    onChange(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  return (
    <fieldset className="rounded-xl border border-border bg-card p-5">
      <legend className="px-2 text-sm font-semibold">Выбор позиций и объёмов</legend>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor={addId} className="text-sm font-medium">
            Добавить позицию из прайса
          </label>
          <select
            id={addId}
            value=""
            onChange={(e) => addLine(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Выберите позицию…</option>
            {allowedCategories.map((c) => (
              <optgroup key={c} label={PRICE_CATEGORY_LABELS[c]}>
                {(itemsByCategory[c] ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {lines.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Выберите одну или несколько позиций. Объём для каждой позиции
          вводится в её фактической единице — единицы между собой не
          конвертируются.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {lines.map((l, i) => {
            const item = getPriceById(l.id);
            if (!item) {
              return (
                <li key={`${l.id}-${i}`} className="rounded-lg border border-border bg-background p-3 text-sm">
                  Неизвестная позиция: <code>{l.id}</code>
                  <button
                    type="button"
                    aria-label="Удалить строку"
                    onClick={() => removeLine(i)}
                    className="ml-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </li>
              );
            }
            const isPct = typeof item.percentageFrom === "number";
            const isByProject =
              item.mode === "individual" || BY_PROJECT_ITEM_IDS.includes(item.id) ||
              (item.priceLabel && item.priceFrom === undefined && item.percentageFrom === undefined);
            return (
              <li key={`${item.id}-${i}`} className="rounded-lg border border-border bg-background p-3">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {PRICE_CATEGORY_LABELS[item.category]} ·{" "}
                      {typeof item.priceFrom === "number" ? `${formatRubles(item.priceFrom)} / ${getUnitDisplay(item)}` :
                        isPct ? `от ${item.percentageFrom}%` :
                        "Рассчитывается по проекту"}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Удалить позицию ${item.name}`}
                    onClick={() => removeLine(i)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
                {isByProject ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Стоимость рассчитывается по проекту.
                  </p>
                ) : isPct ? (
                  <div className="mt-3">
                    <label className="text-xs font-medium" htmlFor={`smr-${i}`}>
                      Стоимость СМР, ₽ (вводится вручную)
                    </label>
                    <input
                      id={`smr-${i}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={l.smetaBase ?? ""}
                      onChange={(e) => updateLine(i, { smetaBase: sanitizeNumber(e.target.value) })}
                      className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                ) : (
                  <div className="mt-3">
                    <label className="text-xs font-medium" htmlFor={`vol-${i}`}>
                      Объём, {getUnitDisplay(item)}
                    </label>
                    <input
                      id={`vol-${i}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={l.volume ?? ""}
                      onChange={(e) => updateLine(i, { volume: sanitizeNumber(e.target.value) })}
                      className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
