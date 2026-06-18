/**
 * Подэтап 2.5.1 — таблицы цен инженерного направления.
 * Данные берутся только из prices.ts по priceCategoryIds.
 * Пакеты и отдельные работы разделены, единицы измерения сохранены.
 */
import { getPricesByCategory } from "@/data/prices";
import { formatPriceItem, getUnitDisplay } from "@/lib/format-price";
import type { PriceCategory } from "@/types/pricing";

interface Props {
  packageCategoryIds?: PriceCategory[];
  priceCategoryIds: PriceCategory[];
}

const CATEGORY_LABELS: Partial<Record<PriceCategory, string>> = {
  electrical_packages: "Пакеты электромонтажа",
  electrical: "Отдельные электромонтажные работы",
  plumbing_packages: "Пакеты сантехники",
  plumbing: "Отдельные сантехнические работы",
  water_supply: "Водоснабжение и канализация",
  heating_packages: "Пакеты отопления",
  heating: "Отдельные работы по отоплению",
  underfloor_heating: "Тёплый пол",
};

export function EngineeringPriceGroups({ packageCategoryIds = [], priceCategoryIds }: Props) {
  const packageIds = new Set(packageCategoryIds);
  const packages = packageCategoryIds.flatMap((c) => getPricesByCategory(c));
  const separate = priceCategoryIds
    .filter((c) => !packageIds.has(c))
    .flatMap((c) => getPricesByCategory(c));

  const sections: Array<{ title: string; items: typeof packages }> = [];
  if (packages.length) sections.push({ title: "Пакетные решения", items: packages });
  if (separate.length) sections.push({ title: "Отдельные работы", items: separate });

  return (
    <section className="border-b border-border py-12">
      <div className="container-page space-y-10">
        {sections.map((sec) => (
          <div key={sec.title}>
            <h2 className="font-display text-2xl font-semibold">{sec.title}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">{sec.title}</caption>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="py-2 pr-4">Категория</th>
                    <th scope="col" className="py-2 pr-4">Работа</th>
                    <th scope="col" className="py-2 pr-4">Единица</th>
                    <th scope="col" className="py-2">Цена</th>
                  </tr>
                </thead>
                <tbody>
                  {sec.items.map((it) => (
                    <tr key={it.id} className="border-b border-border/50">
                      <td className="py-2 pr-4 text-muted-foreground">
                        {CATEGORY_LABELS[it.category] ?? it.category}
                      </td>
                      <td className="py-2 pr-4">{it.name}</td>
                      <td className="py-2 pr-4">{getUnitDisplay(it)}</td>
                      <td className="py-2">{formatPriceItem(it)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}