import { useMemo, useState } from "react";
import type { CalcConfig } from "@/data/pricing/types";
import { formatRub } from "@/data/pricing/types";
import { Link } from "@tanstack/react-router";
import { CalculatorLeadForm } from "./CalculatorLeadForm";

const STORAGE_KEY = "shadov:calculator-snapshot";

interface Props {
  calc: CalcConfig;
  serviceName: string;
  /** Показать поля заявки (имя, телефон, местоположение) прямо в калькуляторе. */
  withLead?: boolean;
}

export function ServiceCalculator({ calc, serviceName, withLead = false }: Props) {
  const [qty, setQty] = useState<number>(calc.defaultQty);
  const [active, setActive] = useState<string[]>([]);

  const result = useMemo(() => {
    const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 0;
    const optionsSum = calc.options
      .filter((o) => active.includes(o.id))
      .reduce((acc, o) => acc + o.addTurnkey, 0);
    const small =
      calc.smallVolume && safeQty > 0 && safeQty < calc.smallVolume.threshold
        ? calc.smallVolume.add
        : 0;
    const perUnitWork = calc.baseWork + optionsSum + small;
    return {
      qty: safeQty,
      perUnitWork,
      work: Math.round(perUnitWork * safeQty),
      total: Math.round(perUnitWork * safeQty),
      small,
    };
  }, [qty, active, calc]);

  function toggle(id: string) {
    setActive((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function saveSnapshot() {
    try {
      const labels = calc.options.filter((o) => active.includes(o.id)).map((o) => o.label);
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode: serviceName,
          qty: result.qty,
          unit: calc.unit,
          options: labels,
          work: result.work,
          material: 0,
          total: result.total,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      /* localStorage может быть недоступен */
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 md:p-6">
      <h2 className="font-display text-lg font-semibold md:text-xl">
        Посчитайте стоимость за 10 секунд
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Расчёт по тому же прайсу, что ниже на странице: только стоимость работ, без материалов. Инженер уточнит цифры на
        замере — но порядок суммы вы видите уже сейчас.
      </p>

      <label className="mt-5 block text-sm font-medium text-foreground" htmlFor="calc-qty">
        {calc.unitLabel}
      </label>
      <input
        id="calc-qty"
        type="number"
        inputMode="numeric"
        min={calc.minQty}
        max={calc.maxQty}
        value={Number.isFinite(qty) ? qty : ""}
        onChange={(e) => setQty(Number(e.target.value))}
        className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-base text-foreground outline-none focus:border-primary"
      />

      {calc.options.length > 0 ? (
        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-foreground">Дополнительно</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {calc.options.map((o) => {
              const on = active.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(o.id)}
                  title={o.hint}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    on
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {o.label} <span className="text-xs opacity-70">+{o.addTurnkey} ₽</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <dl className="mt-6 grid gap-2 rounded-lg bg-muted/40 p-4 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="font-medium text-foreground">Итого за работу</dt>
          <dd className="font-display text-xl font-semibold text-primary">{formatRub(result.total)}</dd>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatRub(result.perUnitWork)} за {calc.unit === "м²" ? "м²" : "точку"}
          {result.small > 0 ? " · учтена надбавка за малый объём" : ""}
        </div>
        <div className="text-xs text-muted-foreground">
          Материалы в расчёт не входят — их покупает заказчик. Закупку и доставку можем взять на себя, обсуждается
          отдельно.
        </div>
      </dl>

      {withLead ? (
        <CalculatorLeadForm
          summary={[
            `Услуга: ${serviceName}`,
            `Объём: ${result.qty} ${calc.unit}`,
            calc.options.filter((o) => active.includes(o.id)).length
              ? `Дополнительно: ${calc.options
                  .filter((o) => active.includes(o.id))
                  .map((o) => o.label)
                  .join(", ")}`
              : "",
            `Итого за работу: ${formatRub(result.total)}`,
          ]
            .filter(Boolean)
            .join("\n")}
        />
      ) : (
        <>
          <Link
            to="/kalkulyator-stoimosti"
            onClick={saveSnapshot}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Отправить расчёт инженеру
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">
            Расчёт сохранится и подставится в заявку — заполнять всё заново не нужно.
          </p>
        </>
      )}
    </div>
  );
}