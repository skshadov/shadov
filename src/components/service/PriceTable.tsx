import type { PriceGroup } from "@/data/pricing/types";

function cell(value: number | null) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  return <>{value.toLocaleString("ru-RU")} ₽</>;
}

export function PriceTable({ group }: { group: PriceGroup }) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="border-b border-border px-5 py-4 md:px-6">
        <h3 className="font-display text-lg font-semibold md:text-xl">{group.title}</h3>
        {group.caption ? (
          <p className="mt-1 text-sm text-muted-foreground">{group.caption}</p>
        ) : null}
      </header>

      {/* Desktop */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-6 py-3 font-medium">Позиция</th>
              <th scope="col" className="px-3 py-3 font-medium">Ед.</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Работа</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Материал</th>
              <th scope="col" className="px-6 py-3 text-right font-medium">Под ключ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {group.rows.map((r) => (
              <tr key={r.name}>
                <td className="px-6 py-4 align-top">
                  <div className="font-medium text-foreground">{r.name}</div>
                  {r.note ? <div className="mt-1 text-xs text-muted-foreground">{r.note}</div> : null}
                </td>
                <td className="whitespace-nowrap px-3 py-4 align-top text-muted-foreground">{r.unit}</td>
                <td className="whitespace-nowrap px-3 py-4 text-right align-top">{cell(r.work)}</td>
                <td className="whitespace-nowrap px-3 py-4 text-right align-top">{cell(r.material)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right align-top font-semibold text-primary">
                  {r.work === null && r.material === null
                    ? "—"
                    : `${((r.work ?? 0) + (r.material ?? 0)).toLocaleString("ru-RU")} ₽`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <ul className="divide-y divide-border md:hidden">
        {group.rows.map((r) => (
          <li key={r.name} className="px-5 py-4">
            <div className="font-medium text-foreground">{r.name}</div>
            {r.note ? <div className="mt-1 text-xs text-muted-foreground">{r.note}</div> : null}
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt className="text-muted-foreground">Работа</dt>
                <dd className="mt-0.5 text-sm text-foreground">{cell(r.work)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Материал</dt>
                <dd className="mt-0.5 text-sm text-foreground">{cell(r.material)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Под ключ, за {r.unit}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-primary">
                  {r.work === null && r.material === null
                    ? "—"
                    : `${((r.work ?? 0) + (r.material ?? 0)).toLocaleString("ru-RU")} ₽`}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}