import { useState } from "react";
import { SERVICE_PRICING } from "@/data/pricing";
import { ServiceCalculator } from "./ServiceCalculator";

export function ServiceCalculatorTabs({ initialSlug }: { initialSlug?: string }) {
  const [slug, setSlug] = useState<string>(
    SERVICE_PRICING.some((s) => s.slug === initialSlug) ? (initialSlug as string) : SERVICE_PRICING[0]!.slug,
  );
  const active = SERVICE_PRICING.find((s) => s.slug === slug) ?? SERVICE_PRICING[0]!;

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Услуга для расчёта" className="flex flex-wrap gap-2">
        {SERVICE_PRICING.map((s) => (
          <button
            key={s.slug}
            type="button"
            role="tab"
            aria-selected={s.slug === active.slug}
            onClick={() => setSlug(s.slug)}
            className={
              "min-h-11 rounded-lg border px-4 py-2 text-sm font-medium transition-colors " +
              (s.slug === active.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary")
            }
          >
            {s.shortName}
          </button>
        ))}
      </div>
      <ServiceCalculator key={active.slug} calc={active.calc} serviceName={active.shortName} />
    </div>
  );
}
