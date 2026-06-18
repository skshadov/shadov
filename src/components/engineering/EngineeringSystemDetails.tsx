/**
 * Подэтап 2.5.1 — детальное описание инженерного направления:
 * этапы, контроль качества, документы, факторы стоимости.
 */
interface Props {
  serviceGroups?: Array<{ title: string; items: string[] }>;
  processSteps?: string[];
  qualityControl?: string[];
  documents?: string[];
  costFactors?: string[];
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((x) => (
          <li key={x}>— {x}</li>
        ))}
      </ul>
    </section>
  );
}

export function EngineeringSystemDetails({
  serviceGroups = [],
  processSteps = [],
  qualityControl = [],
  documents = [],
  costFactors = [],
}: Props) {
  return (
    <section className="border-b border-border py-12">
      <div className="container-page grid gap-10 lg:grid-cols-2">
        {serviceGroups.map((g) => (
          <List key={g.title} title={g.title} items={g.items} />
        ))}
        <List title="Этапы" items={processSteps} />
        <List title="Контроль качества" items={qualityControl} />
        <List title="Документы" items={documents} />
        <List title="Факторы стоимости" items={costFactors} />
      </div>
    </section>
  );
}