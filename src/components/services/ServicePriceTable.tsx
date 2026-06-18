import type { PriceItem } from "@/types/pricing";
import { PriceTable } from "@/components/prices/PriceTable";
import { PriceConditions } from "@/components/prices/PriceConditions";

interface ServicePriceTableProps {
  items: PriceItem[];
  caption?: string;
}

export function ServicePriceTable({ items, caption = "Прайс" }: ServicePriceTableProps) {
  if (items.length === 0) return null;
  return (
    <section className="border-b border-border py-10">
      <div className="container-page space-y-6">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Прайс</h2>
        <PriceTable caption={caption} items={items} />
        <PriceConditions />
      </div>
    </section>
  );
}
