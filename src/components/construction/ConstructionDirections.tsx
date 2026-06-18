/**
 * Подэтап 2.4.1 — направления строительного раздела на агрегатной странице.
 * Ссылается на существующие маршруты строительства.
 */
import { Link } from "@tanstack/react-router";

const DIRECTIONS: Array<{ slug: string; title: string; summary: string }> = [
  { slug: "stroitelstvo-domov-pod-klyuch", title: "Частные дома", summary: "Девять технологий и четыре уровня готовности." },
  { slug: "mnogokvartirnye-doma", title: "Многоквартирные дома", summary: "Стоимость рассчитывается по проекту." },
  { slug: "generalnyy-podryad", title: "Генеральный подряд", summary: "Единый центр ответственности по объекту." },
  { slug: "monolitnye-raboty", title: "Монолитные работы", summary: "Работы по разделу КЖ с контролем бетонирования." },
  { slug: "fundamenty", title: "Фундаменты", summary: "Тип фундамента выбирается по проекту." },
  { slug: "kladochnye-raboty", title: "Кладочные работы", summary: "Контроль геометрии, перевязки и узлов." },
  { slug: "krovelnye-raboty", title: "Кровельные работы", summary: "Скатные и плоские кровли по проекту." },
  { slug: "fasadnye-raboty", title: "Фасадные работы", summary: "Подбор фасадной системы по проекту." },
];

export function ConstructionDirections() {
  return (
    <section className="border-b border-border py-10">
      <div className="container-page space-y-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Направления строительства
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DIRECTIONS.map((d) => (
            <li key={d.slug}>
              <Link
                to={`/${d.slug}` as string as never}
                className="block h-full rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/60"
              >
                <h3 className="font-display text-base font-semibold">{d.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
