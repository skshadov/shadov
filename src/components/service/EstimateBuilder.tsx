/**
 * Калькулятор-смета: пользователь набирает работы прямо из прайса услуги.
 * Базовая работа считается по объёму объекта, любые допы добавляются
 * отдельными строками со своей единицей измерения и количеством.
 */
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, Search } from "lucide-react";
import type { PriceRow, ServicePricing } from "@/data/pricing/types";
import { formatRub } from "@/data/pricing/types";
import { priceRowKey } from "@/data/pricing/derive";
import { CalculatorLeadForm } from "./CalculatorLeadForm";

const STORAGE_KEY = "shadov:calculator-snapshot";

interface Entry {
  key: string;
  group: string;
  row: PriceRow;
}

function collectRows(pricing: ServicePricing): Entry[] {
  const out: Entry[] = [];
  for (const g of pricing.groups) {
    for (const r of g.rows) {
      if (typeof r.work === "number" && r.work > 0) {
        out.push({ key: priceRowKey(g.title, r.name), group: g.title, row: r });
      }
    }
  }
  return out;
}

export function EstimateBuilder({
  pricing,
  withLead = false,
}: {
  pricing: ServicePricing;
  withLead?: boolean;
}) {
  const calc = pricing.calc;
  const entries = useMemo(() => collectRows(pricing), [pricing]);
  const variants = useMemo(() => {
    const keys = calc.baseVariantKeys?.length
      ? calc.baseVariantKeys
      : calc.baseRowKey
        ? [calc.baseRowKey]
        : [];
    const list = keys.map((k) => entries.find((e) => e.key === k)).filter(Boolean) as Entry[];
    return list.length ? list : entries.slice(0, 1);
  }, [entries, calc.baseVariantKeys, calc.baseRowKey]);

  const [baseKey, setBaseKey] = useState<string>(
    () => variants[0]?.key ?? calc.baseRowKey ?? "",
  );
  const baseEntry = useMemo(
    () => variants.find((v) => v.key === baseKey) ?? variants[0],
    [variants, baseKey],
  );

  const [qty, setQty] = useState<number>(calc.defaultQty);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");

  const baseUnit = baseEntry?.row.unit ?? calc.unit;
  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 0;

  const addons = useMemo(
    () => entries.filter((e) => !variants.some((v) => v.key === e.key)),
    [entries, variants],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return addons;
    return addons.filter((e) => `${e.group} ${e.row.name}`.toLowerCase().includes(q));
  }, [addons, query]);

  const groups = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of filtered) {
      const list = map.get(e.group) ?? [];
      list.push(e);
      map.set(e.group, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const baseSum = Math.round((baseEntry?.row.work ?? calc.baseWork) * safeQty);
  const smallAdd =
    calc.smallVolume && safeQty > 0 && safeQty < calc.smallVolume.threshold
      ? Math.round(calc.smallVolume.add * safeQty)
      : 0;

  const lines = useMemo(
    () =>
      addons
        .filter((e) => (picked[e.key] ?? 0) > 0)
        .map((e) => {
          const n = picked[e.key]!;
          return { ...e, qty: n, sum: Math.round((e.row.work as number) * n) };
        }),
    [addons, picked],
  );

  const total = baseSum + smallAdd + lines.reduce((a, l) => a + l.sum, 0);

  function defaultQtyFor(e: Entry) {
    return e.row.unit === baseUnit ? Math.max(1, Math.round(safeQty)) : 1;
  }

  function toggle(e: Entry) {
    setPicked((prev) => {
      const next = { ...prev };
      if ((next[e.key] ?? 0) > 0) delete next[e.key];
      else next[e.key] = defaultQtyFor(e);
      return next;
    });
  }

  function setLineQty(key: string, value: number) {
    setPicked((prev) => {
      const next = { ...prev };
      if (!Number.isFinite(value) || value <= 0) delete next[key];
      else next[key] = value;
      return next;
    });
  }

  const summaryText = [
    `Услуга: ${pricing.shortName}`,
    `${baseEntry?.row.name ?? "Базовая работа"}: ${safeQty} ${baseUnit} — ${formatRub(baseSum)}`,
    smallAdd > 0 ? `Надбавка за малый объём: ${formatRub(smallAdd)}` : "",
    ...lines.map((l) => `${l.row.name}: ${l.qty} ${l.row.unit} — ${formatRub(l.sum)}`),
    `Итого за работу: ${formatRub(total)}`,
  ]
    .filter(Boolean)
    .join("\n");

  function saveSnapshot() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode: pricing.shortName,
          qty: safeQty,
          unit: baseUnit,
          options: lines.map((l) => `${l.row.name} — ${l.qty} ${l.row.unit}`),
          work: total,
          material: 0,
          total,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      /* localStorage может быть недоступен */
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 md:p-6">
      <h2 className="font-display text-lg font-semibold md:text-xl">Соберите свою смету</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Шаг 1 — укажите объём основной работы. Шаг 2 — добавьте нужные работы из прайса: каждая считается в своих
        единицах. Материалы не входят — их покупает заказчик.
      </p>

      {/* Шаг 1 */}
      <div className="mt-5 rounded-lg border border-border bg-background p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Шаг 1 — основной объём</div>
        {variants.length > 1 ? (
          <fieldset className="mt-3">
            <legend className="text-sm font-medium text-foreground">
              {calc.baseVariantLabel ?? "Вариант основной работы"}
            </legend>
            <div className="mt-2 space-y-1.5">
              {variants.map((v) => (
                <label
                  key={v.key}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 ${
                    v.key === baseEntry?.key ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="calc-base-variant"
                    checked={v.key === baseEntry?.key}
                    onChange={() => setBaseKey(v.key)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-foreground">{v.row.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatRub(v.row.work as number)}/{v.row.unit}
                      {v.row.note ? ` · ${v.row.note}` : ""}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Варианты взаимоисключающие — считается только выбранный. Нужны обе технологии на объекте (например,
              гипс в комнатах и цемент в санузле) — посчитайте двумя расчётами или скажите инженеру на замере.
            </p>
          </fieldset>
        ) : null}
        <label className="mt-4 block text-sm font-medium text-foreground" htmlFor="calc-qty">
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
        <div className="mt-2 flex items-baseline justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            {baseEntry?.row.name} — {formatRub(baseEntry?.row.work ?? calc.baseWork)}/{baseUnit}
          </span>
          <span className="font-medium text-foreground">{formatRub(baseSum)}</span>
        </div>
        {pricing.baseIncludes?.length ? (
          <details className="mt-3 rounded-lg bg-muted/40 p-3">
            <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wider text-primary marker:hidden">
              Что входит в базовую цену
            </summary>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              {pricing.baseIncludes.map((c) => (
                <li key={c} className="flex gap-2">
                  <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Подготовка основания, усиление, изоляция и узлы в базу не входят — добавьте их шагом 2.
            </p>
          </details>
        ) : null}
      </div>

      {/* Шаг 2 */}
      <div className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Шаг 2 — дополнительные работы
          </div>
          <span className="text-xs text-muted-foreground">Выбрано: {lines.length}</span>
        </div>

        <div className="relative mt-2">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти работу: штробление, автомат, коллектор…"
            aria-label="Поиск работы в прайсе"
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {groups.map(([title, rows], gi) => (
            <details key={title} open={gi === 0 || query.length > 0} className="rounded-lg border border-border">
              <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-foreground marker:hidden">
                {title}
                <span className="ml-2 text-xs text-muted-foreground">{rows.length}</span>
              </summary>
              <ul className="space-y-1 border-t border-border p-2">
                {rows.map((e) => {
                  const value = picked[e.key] ?? 0;
                  const on = value > 0;
                  return (
                    <li key={e.key} className={`rounded-md p-2 ${on ? "bg-primary/5" : ""}`}>
                      <label className="flex cursor-pointer items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(e)}
                          className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-foreground">{e.row.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {formatRub(e.row.work as number)}/{e.row.unit}
                            {e.row.note ? ` · ${e.row.note}` : ""}
                          </span>
                        </span>
                      </label>
                      {on ? (
                        <div className="mt-2 flex items-center justify-between gap-2 pl-7">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              aria-label="Уменьшить количество"
                              onClick={() => setLineQty(e.key, value - 1)}
                              className="grid h-8 w-8 place-items-center rounded-md border border-border text-foreground hover:border-primary"
                            >
                              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={value}
                              aria-label={`Количество: ${e.row.name}`}
                              onChange={(ev) => setLineQty(e.key, Number(ev.target.value))}
                              className="h-8 w-20 rounded-md border border-border bg-background px-2 text-center text-sm text-foreground outline-none focus:border-primary"
                            />
                            <button
                              type="button"
                              aria-label="Увеличить количество"
                              onClick={() => setLineQty(e.key, value + 1)}
                              className="grid h-8 w-8 place-items-center rounded-md border border-border text-foreground hover:border-primary"
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                            <span className="ml-1 text-xs text-muted-foreground">{e.row.unit}</span>
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {formatRub(Math.round((e.row.work as number) * value))}
                          </span>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </details>
          ))}
          {groups.length === 0 ? (
            <p className="px-1 py-3 text-sm text-muted-foreground">Ничего не нашлось — попробуйте другое слово.</p>
          ) : null}
        </div>
      </div>

      {/* Итого */}
      <div className="mt-5 rounded-lg bg-muted/40 p-4 text-sm">
        <ul className="space-y-1.5">
          <li className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              {baseEntry?.row.name} · {safeQty} {baseUnit}
            </span>
            <span className="shrink-0 text-foreground">{formatRub(baseSum)}</span>
          </li>
          {smallAdd > 0 ? (
            <li className="flex justify-between gap-4">
              <span className="text-muted-foreground">Надбавка за малый объём</span>
              <span className="shrink-0 text-foreground">{formatRub(smallAdd)}</span>
            </li>
          ) : null}
          {lines.map((l) => (
            <li key={l.key} className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                {l.row.name} · {l.qty} {l.row.unit}
              </span>
              <span className="shrink-0 text-foreground">{formatRub(l.sum)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-border pt-3">
          <span className="font-medium text-foreground">Итого за работу</span>
          <span className="font-display text-xl font-semibold text-primary">{formatRub(total)}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Материалы в расчёт не входят — их покупает заказчик. Итог фиксируется в смете после замера.
        </p>
      </div>

      {withLead ? (
        <CalculatorLeadForm summary={summaryText} />
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
