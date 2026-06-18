import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { ServicePageData } from "@/types/services";

interface RelatedServicesProps { items: ServicePageData[] }
export function RelatedServices({ items }: RelatedServicesProps) {
  if (items.length === 0) return null;
  return (
    <section className="border-b border-border py-10">
      <div className="container-page">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Связанные услуги</h2>
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <li key={s.slug}>
              <Link to={s.route} className="group flex items-start justify-between gap-3 rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/60">
                <div>
                  <p className="font-semibold">{s.title}</p>
                  {s.startingPrice ? <p className="mt-1 text-xs text-primary">{s.startingPrice}</p> : null}
                </div>
                <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
