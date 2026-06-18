/**
 * Подэтап 2.4.1 — таблица цен по технологиям и уровням готовности.
 * Источник данных: HOUSE_TECHNOLOGIES. Цены не дублируются.
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { HOUSE_TECHNOLOGIES } from "@/data/house-technologies";
import { formatRubles } from "@/lib/format-price";

type Mode = "work" | "materials";

interface Props {
  /** Заголовок над переключателем. */
  heading?: string;
}

export function HouseTechnologyMatrix({ heading }: Props) {
  const [mode, setMode] = useState<Mode>("work");
  return (
    <section className="border-b border-border py-10">
      <div className="container-page space-y-4">
        {heading ? (
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            {heading}
          </h2>
        ) : null}
        <div role="radiogroup" aria-label="Режим отображения цен" className="flex flex-wrap gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={mode === "work"}
            onClick={() => setMode("work")}
            className={`rounded-md border px-4 py-2 text-sm ${mode === "work" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
          >
            Только работы
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "materials"}
            onClick={() => setMode("materials")}
            className={`rounded-md border px-4 py-2 text-sm ${mode === "materials" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
          >
            Работы и базовые материалы
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          {mode === "work" ? (
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">
                Цены на строительство домов — только работы по технологиям и уровням готовности
              </caption>
              <thead className="bg-[color:var(--surface-medium)] text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Технология</th>
                  <th scope="col" className="px-4 py-3">Коробка</th>
                  <th scope="col" className="px-4 py-3">Тёплый контур</th>
                  <th scope="col" className="px-4 py-3">Под чистовую</th>
                  <th scope="col" className="px-4 py-3">Под ключ</th>
                </tr>
              </thead>
              <tbody>
                {HOUSE_TECHNOLOGIES.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <th scope="row" className="px-4 py-3 font-medium">
                      <Link to={`/${t.slug}` as string as never} className="hover:text-primary">
                        {t.name}
                      </Link>
                    </th>
                    <td className="px-4 py-3 font-semibold">от {formatRubles(t.workPrices.shell)}/м²</td>
                    <td className="px-4 py-3 font-semibold">от {formatRubles(t.workPrices.warmShell)}/м²</td>
                    <td className="px-4 py-3 font-semibold">от {formatRubles(t.workPrices.preFinish)}/м²</td>
                    <td className="px-4 py-3 font-semibold">от {formatRubles(t.workPrices.turnkey)}/м²</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[480px] text-left text-sm">
              <caption className="sr-only">
                Цены на строительство домов с базовыми материалами для уровня «Под ключ»
              </caption>
              <thead className="bg-[color:var(--surface-medium)] text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Технология</th>
                  <th scope="col" className="px-4 py-3">Под ключ с базовыми материалами</th>
                </tr>
              </thead>
              <tbody>
                {HOUSE_TECHNOLOGIES.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <th scope="row" className="px-4 py-3 font-medium">
                      <Link to={`/${t.slug}` as string as never} className="hover:text-primary">
                        {t.name}
                      </Link>
                    </th>
                    <td className="px-4 py-3 font-semibold">
                      от {formatRubles(t.turnkeyWithBasicMaterials)}/м²
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
