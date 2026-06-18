import { Check, X } from "lucide-react";

interface ListBlockProps {
  title: string;
  items: string[];
  variant?: "default" | "negative";
  ordered?: boolean;
}

export function ListBlock({ title, items, variant = "default", ordered }: ListBlockProps) {
  if (items.length === 0) return null;
  const Tag = ordered ? "ol" : "ul";
  const Icon = variant === "negative" ? X : Check;
  const iconClass = variant === "negative" ? "text-[color:var(--accent-error)]" : "text-primary";
  return (
    <section className="border-b border-border py-10">
      <div className="container-page">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
        <Tag className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2 rounded-md border border-border bg-card p-3 text-sm leading-relaxed">
              {ordered ? (
                <span aria-hidden="true" className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{i + 1}</span>
              ) : (
                <Icon aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} />
              )}
              <span>{it}</span>
            </li>
          ))}
        </Tag>
      </div>
    </section>
  );
}
