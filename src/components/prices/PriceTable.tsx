/**
 * Подэтап 2.1A — таблица цен. unitLabel из данных выводится в столбце «Единица».
 */
import type { PriceItem } from "@/types/pricing";
import { formatPriceItem, formatActualDate, getUnitDisplay } from "@/lib/format-price";

interface PriceTableProps {
  caption: string;
  items: PriceItem[];
  showActualDate?: boolean;
  className?: string;
}

export function PriceTable({ caption, items, showActualDate = true, className }: PriceTableProps) {
  if (items.length === 0) return null;
  const hasNotes = items.some((i) => i.note);

  return (
    <div
      className={`overflow-x-auto rounded-lg border border-border bg-card ${className ?? ""}`}
      tabIndex={0}
      aria-label="Прокручиваемая таблица цен"
    >
      <table className="w-full min-w-[480px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-[color:var(--surface-medium)] text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">Работа или услуга</th>
            <th scope="col" className="px-4 py-3">Единица</th>
            <th scope="col" className="px-4 py-3">Цена за работу</th>
            {hasNotes ? <th scope="col" className="px-4 py-3">Примечание</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-border">
              <th scope="row" className="px-4 py-3 font-medium">{item.name}</th>
              <td className="px-4 py-3 text-muted-foreground">{getUnitDisplay(item)}</td>
              <td className="px-4 py-3 font-semibold">{formatPriceItem(item) || "—"}</td>
              {hasNotes ? <td className="px-4 py-3 text-xs text-muted-foreground">{item.note ?? ""}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
      {showActualDate ? (
        <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          Дата актуализации: {formatActualDate("2026-06")}
        </p>
      ) : null}
    </div>
  );
}
