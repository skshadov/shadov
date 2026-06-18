/**
 * Подэтап 2.1 — обязательные дисклеймеры цены (§4 запроса).
 */
import { formatActualDate } from "@/lib/format-price";

export function PriceConditions() {
  return (
    <aside className="rounded-lg border border-border bg-[color:var(--surface-medium)] p-4 text-xs leading-relaxed text-muted-foreground">
      <p>
        Цены указаны за работы. Материалы рассчитываются отдельно, если иное прямо не предусмотрено выбранной комплектацией.
      </p>
      <p className="mt-2">
        Цены являются ориентировочными, не являются публичной офертой и используются для предварительной оценки бюджета.
        Точная стоимость определяется после изучения проекта, обследования объекта и подготовки сметы.
      </p>
      <p className="mt-2">Дата актуализации: {formatActualDate("2026-06")}</p>
    </aside>
  );
}
