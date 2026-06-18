/**
 * Подэтап 2.4.2 — компактная таблица цен одной технологии.
 * Источник: HOUSE_TECHNOLOGIES. Цены не дублируются вручную.
 */
import type { HouseTechnology } from "@/data/house-technologies";
import { HOUSE_COMPLETION_LEVELS, HOUSE_TURNKEY_WITH_BASIC_MATERIALS_LABEL } from "@/data/house-technologies";
import { formatRubles } from "@/lib/format-price";

interface Props {
  tech: HouseTechnology;
}

const DISCLAIMER =
  "Цена с базовыми материалами является ориентировочной комплектацией. Точный перечень материалов, оборудования и работ фиксируется в смете и договоре.";

export function HouseTechnologyPrices({ tech }: Props) {
  const idToPrice: Record<string, number> = {
    shell: tech.workPrices.shell,
    warmShell: tech.workPrices.warmShell,
    preFinish: tech.workPrices.preFinish,
    turnkey: tech.workPrices.turnkey,
  };
  return (
    <section className="border-b border-border py-10">
      <div className="container-page space-y-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Цены технологии «{tech.name}»
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[320px] text-left text-sm">
            <caption className="sr-only">
              Цены технологии «{tech.name}» по уровням готовности, только работы
            </caption>
            <thead className="bg-[color:var(--surface-medium)] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">Уровень готовности</th>
                <th scope="col" className="px-4 py-3">Только работы</th>
              </tr>
            </thead>
            <tbody>
              {HOUSE_COMPLETION_LEVELS.map((lvl) => (
                <tr key={lvl.id} className="border-t border-border">
                  <th scope="row" className="px-4 py-3 font-medium">{lvl.name}</th>
                  <td className="px-4 py-3 font-semibold">
                    от {formatRubles(idToPrice[lvl.id])}/м²
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {HOUSE_TURNKEY_WITH_BASIC_MATERIALS_LABEL}
          </p>
          <p className="mt-1 font-display text-xl font-semibold">
            от {formatRubles(tech.turnkeyWithBasicMaterials)}/м²
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{DISCLAIMER}</p>
        </div>
      </div>
    </section>
  );
}