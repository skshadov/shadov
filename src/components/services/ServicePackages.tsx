import type { RepairPackage } from "@/data/repair-packages";
import { PricePackageCard } from "@/components/prices/PricePackageCard";

interface ServicePackagesProps { packages: RepairPackage[] }
export function ServicePackages({ packages }: ServicePackagesProps) {
  if (packages.length === 0) return null;
  return (
    <section className="border-b border-border py-10">
      <div className="container-page">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Варианты и комплектации</h2>
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => (<li key={p.id}><PricePackageCard pkg={p} /></li>))}
        </ul>
      </div>
    </section>
  );
}
