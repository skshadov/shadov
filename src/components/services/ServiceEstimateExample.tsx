/**
 * Подэтап 2.1 — пример структуры сметы. Не итог объекта, не оферта.
 */
import type { PriceItem } from "@/types/pricing";
import { formatPriceItem, formatRubles } from "@/lib/format-price";

export type EstimateExampleRow = {
  item: PriceItem;
  volume?: number;
  note?: string;
};

interface ServiceEstimateExampleProps {
  rows: EstimateExampleRow[];
}

export function ServiceEstimateExample({ rows }: ServiceEstimateExampleProps) {
  if (rows.length === 0) return null;
  return (
    <section className="border-b border-border py-10">
      <div className="container-page space-y-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Пример структуры сметы</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-card" tabIndex={0} aria-label="Прокручиваемая таблица примера сметы">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Пример структуры сметы</caption>
            <thead className="bg-[color:var(--surface-medium)] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">Наименование</th>
                <th scope="col" className="px-4 py-3">Объём</th>
                <th scope="col" className="px-4 py-3">Единица</th>
                <th scope="col" className="px-4 py-3">Цена</th>
                <th scope="col" className="px-4 py-3">Сумма</th>
                <th scope="col" className="px-4 py-3">Примечание</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const vol = r.volume;
                const sum =
                  r.item.priceFrom && typeof vol === "number"
                    ? r.item.priceFrom * vol
                    : undefined;
                return (
                  <tr key={r.item.id} className="border-t border-border">
                    <th scope="row" className="px-4 py-3 font-medium">{r.item.name}</th>
                    <td className="px-4 py-3">
                      {typeof vol === "number" ? (
                        <span className="flex flex-col">
                          <span>{vol}</span>
                          {volLabel ? (
                            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              {volLabel}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.item.unit ?? "—"}</td>
                    <td className="px-4 py-3">{formatPriceItem(r.item) || "—"}</td>
                    <td className="px-4 py-3 font-semibold">{sum ? `от ${formatRubles(sum)}` : "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.note ?? r.item.note ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs italic text-muted-foreground">
          Пример структуры. Не является сметой, коммерческим предложением или публичной офертой.
        </p>
      </div>
    </section>
  );
}
