/**
 * Подэтап 2.1 — карточка пакета (ремонт, электромонтаж и т. п.).
 */
import { Link } from "@tanstack/react-router";
import type { RepairPackage } from "@/data/repair-packages";
import { formatRubles } from "@/lib/format-price";

interface PricePackageCardProps {
  pkg: RepairPackage;
}

export function PricePackageCard({ pkg }: PricePackageCardProps) {
  const inner = (
    <article className="flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/60">
      <h3 className="font-display text-lg font-semibold">{pkg.name}</h3>
      <p className="mt-1 text-sm text-primary">от {formatRubles(pkg.priceFrom)}/{pkg.unit}</p>
      <p className="mt-3 text-sm text-muted-foreground">{pkg.suitableFor}</p>
    </article>
  );
  if (pkg.slug) {
    return <Link to={`/${pkg.slug}` as string as never}>{inner}</Link>;
  }
  return inner;
}
