/**
 * Короткий обзор трёх блоков услуг §10 — мост к страницам-заглушкам.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { NAV_STROITELSTVO, NAV_REMONT, NAV_INZHENERNYE } from "@/data/navigation";

const GROUPS = [NAV_STROITELSTVO, NAV_REMONT, NAV_INZHENERNYE];

export function ServicesOverview() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow="Наши услуги"
          title="Три ключевых направления работы"
        />
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {GROUPS.map((g) => (
            <article key={g.to} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
              <header>
                <h3 className="font-display text-xl font-semibold">{g.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>
              </header>
              <ul className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2 md:grid-cols-1">
                {g.items.slice(0, 6).map((s) => (
                  <li key={s.to}>
                    <Link
                      to={s.to}
                      className="block rounded-md px-2 py-1 text-foreground/90 hover:bg-accent"
                    >
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to={g.to}
                className="mt-auto inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-primary"
              >
                Все услуги раздела
                <ArrowRight aria-hidden="true" className="h-3 w-3" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}