/**
 * Подэтап 2.5.1 — карточка пакетного решения инженерного направления.
 * Состав пакета не выдумывается. Если состав не подтверждён данными,
 * выводится утверждённый дисклеймер.
 */
import { formatPriceItem } from "@/lib/format-price";
import type { PriceItem } from "@/types/pricing";

export const PACKAGE_COMPOSITION_DISCLAIMER =
  "Точный состав пакета определяется после изучения объекта и фиксируется в смете и договоре.";

interface Props {
  pkg: PriceItem;
  composition?: string[];
}

export function EngineeringPackageCard({ pkg, composition }: Props) {
  const items = composition ?? [];
  return (
    <article className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-display text-lg font-semibold">{pkg.name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{formatPriceItem(pkg)}</p>
      {items.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm">
          {items.map((it) => (
            <li key={it}>— {it}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          {PACKAGE_COMPOSITION_DISCLAIMER}
        </p>
      )}
    </article>
  );
}