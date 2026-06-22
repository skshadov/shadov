/**
 * Обязательные дисклеймеры рядом со стартовыми ценами на главной
 * (уточнение 5 пользователя + §13 ТЗ). Тексты дословные.
 */
import { PRICES_ACTUAL_DATE } from "@/data/home-prices";

interface PriceDisclaimerProps {
  className?: string;
  showDate?: boolean;
}

export function PriceDisclaimer({ className, showDate = true }: PriceDisclaimerProps) {
  return (
    <div
      className={`rounded-md border border-border/60 bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground ${className ?? ""}`}
    >
      <p>
        Цены указаны за работы. Материалы рассчитываются отдельно, если иное прямо не предусмотрено выбранной комплектацией.
      </p>
      <p className="mt-2">
        Цены являются ориентировочными, не являются публичной офертой и используются для предварительной оценки бюджета. Точная стоимость определяется после изучения проекта, обследования объекта и подготовки сметы.
      </p>
      {showDate ? (
        <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
          Дата актуализации: {PRICES_ACTUAL_DATE}
        </p>
      ) : null}
    </div>
  );
}