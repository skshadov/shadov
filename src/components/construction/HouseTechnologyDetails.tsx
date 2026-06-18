/**
 * Подэтап 2.4.1 — технические сведения по технологии дома.
 * Пустые секции не рендерятся, однако массивы должны быть заполнены.
 */
import type { HouseTechnology } from "@/data/house-technologies";

interface Props {
  tech: HouseTechnology;
}

function Block({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <ul className="mt-2 space-y-1 text-sm">
        {items.map((x) => (
          <li key={x} className="flex gap-2">
            <span aria-hidden="true" className="text-primary">•</span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HouseTechnologyDetails({ tech }: Props) {
  return (
    <section className="border-b border-border py-10">
      <div className="container-page space-y-6">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Технология «{tech.name}»
          </h2>
          <p className="mt-2 text-muted-foreground">{tech.constructionPrinciple}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Block title="Подходящие фундаменты" items={tech.suitableFoundations} />
          <Block title="Стены" items={tech.wallSystem} />
          <Block title="Перекрытия" items={tech.floorSystems} />
          <Block title="Кровля" items={tech.roofOptions} />
          <Block title="Инженерные системы" items={tech.engineeringSystems} />
          <Block title="Преимущества" items={tech.benefits} />
          <Block title="Ограничения" items={tech.limitations} />
        </div>
      </div>
    </section>
  );
}
