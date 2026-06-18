/**
 * Подэтап 2.1 — якорная навигация по категориям прайса.
 */
import type { PriceCategory } from "@/types/pricing";
import { PRICE_CATEGORY_LABELS } from "@/types/pricing";

interface PriceCategoryNavigationProps {
  categories: PriceCategory[];
  className?: string;
}

export function PriceCategoryNavigation({ categories, className }: PriceCategoryNavigationProps) {
  if (categories.length === 0) return null;
  return (
    <nav aria-label="Категории прайса" className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      {categories.map((c) => (
        <a
          key={c}
          href={`#${c}`}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
        >
          {PRICE_CATEGORY_LABELS[c]}
        </a>
      ))}
    </nav>
  );
}
