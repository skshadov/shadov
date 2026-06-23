import { Link } from "@tanstack/react-router";
import {
  MATERIAL_LONG_LABEL,
  MATERIAL_RATES,
  MATERIAL_SERVICE_SLUG,
  estimateCost,
  formatRub,
  type MaterialKey,
} from "@/data/projects-pricing";

export function CostByMaterials({ area, materials }: { area: number; materials: MaterialKey[] }) {
  const order: MaterialKey[] = ["frame", "sip", "gas", "brick"];
  const rows = order.filter((m) => materials.includes(m));

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-display text-xl font-semibold">Стоимость строительства</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ориентировочная стоимость работ по площади {area} м² для разных материалов. Сам проект бесплатно входит в стоимость.
        </p>
      </div>
      <div className="divide-y divide-border">
        {rows.map((m) => {
          const total = estimateCost(area, m);
          return (
            <div key={m} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 sm:grid-cols-[2fr_auto_auto]">
              <div>
                <Link
                  to={`/${MATERIAL_SERVICE_SLUG[m]}`}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {MATERIAL_LONG_LABEL[m]}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {formatRub(MATERIAL_RATES[m])} / м² × {area} м²
                </div>
              </div>
              <div className="hidden text-right text-xs uppercase tracking-wider text-muted-foreground sm:block">от</div>
              <div className="text-right">
                <div className="font-display text-lg font-semibold text-foreground">{formatRub(total)}</div>
                <div className="text-[11px] text-muted-foreground">ориентировочно</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border bg-muted/50 px-5 py-3 text-xs text-muted-foreground">
        Финальная смета составляется инженером после выезда на участок. Расчёт бесплатный.
      </div>
    </div>
  );
}