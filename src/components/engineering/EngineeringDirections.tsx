/**
 * Подэтап 2.5.1 — карточки пяти инженерных направлений для обзорной
 * страницы /inzhenernye-sistemy. Не подключается к route на 2.5.1.
 */
import { Link } from "@tanstack/react-router";
import { ENGINEERING_SERVICE_PAGES } from "@/data/service-pages-engineering";

const DIRECTION_SLUGS = [
  "elektromontazh",
  "santehnika",
  "vodosnabzhenie-kanalizatsiya",
  "otoplenie",
  "teplyy-pol",
] as const;

export function EngineeringDirections() {
  const items = DIRECTION_SLUGS.map((s) =>
    ENGINEERING_SERVICE_PAGES.find((p) => p.slug === s),
  ).filter((p): p is (typeof ENGINEERING_SERVICE_PAGES)[number] => Boolean(p));

  return (
    <section className="border-b border-border py-12">
      <div className="container-page">
        <h2 className="font-display text-2xl font-semibold">
          Пять инженерных направлений
        </h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <li key={p.slug}>
              <Link
                to={p.route as "/elektromontazh"}
                className="block rounded-lg border border-border bg-card p-5 hover:border-primary"
              >
                <h3 className="font-display text-lg font-semibold">{p.h1}</h3>
                {p.intro ? (
                  <p className="mt-2 text-sm text-muted-foreground">{p.intro}</p>
                ) : null}
                {p.startingPrice ? (
                  <p className="mt-3 text-sm">{p.startingPrice}</p>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Стоимость рассчитывается по составу работ
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}