import { Link } from "@tanstack/react-router";
import { Check, Info, ShieldCheck, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PriceTable } from "./PriceTable";
import { ServiceCalculator } from "./ServiceCalculator";
import type { ServicePricing } from "@/data/pricing/types";
import { formatRub } from "@/data/pricing/types";
import { SERVICE_PRICING } from "@/data/pricing";
import { EstimateForm } from "@/components/forms/EstimateForm";

export function ServiceLandingPage({ data }: { data: ServicePricing }) {
  const others = SERVICE_PRICING.filter((s) => s.slug !== data.slug);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex-1">
        <div className="container-page py-8 md:py-12">
          <Breadcrumbs
            items={[{ label: "Главная", to: "/" }, { label: "Цены", to: "/prices" }, { label: data.shortName }]}
            className="mb-6"
          />

          {/* 1. Первый экран: H1 + цена + калькулятор */}
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <h1 className="font-display text-3xl font-semibold leading-tight text-balance sm:text-4xl md:text-[44px]">
                {data.h1}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">{data.lead}</p>

              <div className="mt-6 rounded-xl border border-primary/40 bg-primary/5 p-5">
                <div className="font-display text-2xl font-semibold text-primary sm:text-3xl">
                  {data.priceHeadline}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">{data.priceHeadlineNote}</p>
              </div>

              <div className="mt-6 rounded-xl border border-border bg-card p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <Info aria-hidden="true" className="h-4 w-4" />
                  Базовая цена действует при этих условиях
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-foreground/90">
                  {data.baseConditions.map((c) => (
                    <li key={c} className="flex gap-2">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <ServiceCalculator calc={data.calc} serviceName={data.shortName} />
          </div>

          {/* 2. Прайс */}
          <section className="mt-14" aria-labelledby="price">
            <h2 id="price" className="font-display text-2xl font-semibold sm:text-3xl">
              Прайс: {data.shortName.toLowerCase()}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Мы не пишем «от». Здесь указана цена при конкретных условиях и все надбавки цифрами — чтобы итог в смете
              совпал с итогом в акте.
            </p>
            <div className="mt-6 grid gap-6">
              {data.groups.map((g) => (
                <PriceTable key={g.title} group={g} />
              ))}
            </div>
          </section>

          {/* 3. Что входит / что отдельно */}
          <section className="mt-14 grid gap-6 md:grid-cols-2" aria-labelledby="included">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 id="included" className="font-display text-xl font-semibold">Что входит в цену</h2>
              <ul className="mt-4 space-y-2.5 text-sm text-foreground/90">
                {data.included.map((i) => (
                  <li key={i} className="flex gap-2.5">
                    <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">Что оплачивается отдельно</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Показываем этот список так же крупно — чтобы не было сюрпризов в конце.
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-foreground/90">
                {data.excluded.map((i) => (
                  <li key={i} className="flex gap-2.5">
                    <X aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 4. Пакеты */}
          <section className="mt-14" aria-labelledby="packages">
            <h2 id="packages" className="font-display text-2xl font-semibold sm:text-3xl">
              Готовые примеры с итоговой суммой
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Люди считают не квадратные метры, а квартиру. Вот три типовых объекта с реальным итогом по нашему прайсу.
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {data.packages.map((p) => (
                <article key={p.title} className="flex flex-col rounded-xl border border-border bg-card p-6">
                  <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.subtitle}</p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-foreground/90">
                    {p.scope.map((s) => (
                      <li key={s} className="flex gap-2">
                        <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                  <dl className="mt-5 space-y-1 border-t border-border pt-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Только работа</dt>
                      <dd className="text-foreground">{formatRub(p.workTotal)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-medium text-foreground">Под ключ</dt>
                      <dd className="font-display text-xl font-semibold text-primary">{formatRub(p.turnkeyTotal)}</dd>
                    </div>
                    <div className="pt-1 text-xs text-muted-foreground">Срок: {p.term}</div>
                  </dl>
                </article>
              ))}
            </div>
          </section>

          {/* 5. Этапы */}
          <section className="mt-14" aria-labelledby="stages">
            <h2 id="stages" className="font-display text-2xl font-semibold sm:text-3xl">Как проходит работа</h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-5">
              {data.stages.map((s, i) => (
                <li key={s.title} className="rounded-xl border border-border bg-card p-5">
                  <div className="font-display text-sm font-semibold text-primary">Шаг {i + 1}</div>
                  <h3 className="mt-1 font-medium text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                  <div className="mt-3 text-xs text-muted-foreground">{s.term}</div>
                </li>
              ))}
            </ol>
          </section>

          {/* 6. Гарантия и условия */}
          <section className="mt-14 grid gap-6 md:grid-cols-2" aria-labelledby="guarantee">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 id="guarantee" className="flex items-center gap-2 font-display text-xl font-semibold">
                <ShieldCheck aria-hidden="true" className="h-5 w-5 text-primary" />
                Гарантия
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">{data.guarantee}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">Условия работы</h2>
              <ul className="mt-3 space-y-2 text-sm text-foreground/90">
                {data.conditions.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 7. FAQ */}
          <section className="mt-14" aria-labelledby="faq">
            <h2 id="faq" className="font-display text-2xl font-semibold sm:text-3xl">Частые вопросы</h2>
            <div className="mt-6 grid gap-3">
              {data.faq.map((f) => (
                <details key={f.q} className="group rounded-xl border border-border bg-card p-5">
                  <summary className="cursor-pointer list-none font-medium text-foreground marker:hidden">
                    {f.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* 8. Форма */}
          <section className="mt-14" aria-labelledby="request">
            <h2 id="request" className="font-display text-2xl font-semibold sm:text-3xl">
              Получить смету с фиксированным итогом
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Инженер приедет на замер, посчитает по этому же прайсу и оставит вам смету. Итог в смете — это итог в акте.
            </p>
            <div className="mt-6 max-w-3xl">
              <EstimateForm />
            </div>
          </section>

          {/* Перелинковка */}
          <section className="mt-14" aria-labelledby="other">
            <h2 id="other" className="font-display text-xl font-semibold">Другие наши услуги</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {others.map((s) => (
                <Link
                  key={s.slug}
                  to={s.path as never}
                  className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                >
                  {s.shortName}
                </Link>
              ))}
              <Link
                to="/prices"
                className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                Сводный прайс
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}