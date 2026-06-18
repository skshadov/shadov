/**
 * Подэтап 2.4.1 — состав четырёх уровней готовности дома.
 * Доступные <details> с описанием, included и excluded.
 */
import { HOUSE_COMPLETION_DISCLAIMER, HOUSE_COMPLETION_LEVELS } from "@/data/house-technologies";

export function HouseCompletionLevels() {
  return (
    <section className="border-b border-border py-10">
      <div className="container-page space-y-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Уровни готовности дома
        </h2>
        <div className="grid gap-3">
          {HOUSE_COMPLETION_LEVELS.map((lvl, idx) => (
            <details
              key={lvl.id}
              open={idx === 0}
              className="rounded-lg border border-border bg-card p-5 transition-colors open:border-primary/60"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold">{lvl.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {lvl.included.length} включено · {lvl.excluded.length} не включено
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{lvl.description}</p>
              </summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Что входит
                  </h4>
                  <ul className="mt-2 space-y-1 text-sm">
                    {lvl.included.map((i) => (
                      <li key={i} className="flex gap-2">
                        <span aria-hidden="true" className="text-primary">•</span>
                        <span>{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Не включено
                  </h4>
                  <ul className="mt-2 space-y-1 text-sm">
                    {lvl.excluded.map((i) => (
                      <li key={i} className="flex gap-2">
                        <span aria-hidden="true" className="text-muted-foreground">—</span>
                        <span>{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{HOUSE_COMPLETION_DISCLAIMER}</p>
      </div>
    </section>
  );
}
