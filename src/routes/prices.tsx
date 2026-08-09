import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";
import { PriceTable } from "@/components/service/PriceTable";
import { SERVICE_PRICING, formatRub } from "@/data/pricing";
import { useLivePricingList } from "@/lib/site-content/store";
import { PRICES_ACTUAL_DATE } from "@/data/home-prices";

const TITLE = "Цены на штукатурку, стяжку, тёплый пол, электрику и сантехнику | Шадов и партнёры";
const DESCRIPTION =
  "Полный прайс без «от»: цены только за работу по каждой позиции — материалы покупает заказчик. Штукатурка, стяжка, тёплый пол, разводка электрики и сантехники в Москве и области.";

export const Route = createFileRoute("/prices")({
  head: () =>
    buildInfoHead({
      title: TITLE,
      description: DESCRIPTION,
      path: "/prices",
      breadcrumbs: [
        { name: "Главная", path: "/" },
        { name: "Цены", path: "/prices" },
      ],
    }),
  component: PricesPage,
});

function PricesPage() {
  const services = useLivePricingList();
  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Цены" }]}
      h1="Цены на работы"
      intro={`Все цены указаны только за работу — материалы заказчик выбирает и покупает сам. При необходимости закупим и доставим материалы, стоимость закупки обсуждается отдельно. Все надбавки — за слой, за объём, за нестандарт — перечислены отдельными строками, поэтому итог в смете совпадает с прайсом. Цены актуальны на ${PRICES_ACTUAL_DATE.toLowerCase()} для Москвы и области до 30 км от МКАД.`}
    >
      <section aria-label="Краткая сводка цен" className="overflow-hidden rounded-xl border border-border bg-card">
        <header className="border-b border-border px-5 py-4 md:px-6">
          <h2 className="font-display text-lg font-semibold md:text-xl">Коротко: сколько стоит работа</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Базовая цена работы при стандартных условиях, без стоимости материалов. Полные условия — в таблицах ниже.
          </p>
        </header>
        <ul className="divide-y divide-border">
          {SERVICE_PRICING.map((s) => (
            <li key={s.slug} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
              <div>
                <Link to={s.path as never} className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline">
                  {s.shortName}
                </Link>
                <p className="mt-0.5 text-sm text-muted-foreground">{s.priceHeadlineNote}</p>
              </div>
              <div className="whitespace-nowrap font-semibold text-primary">{s.priceHeadline}</div>
            </li>
          ))}
        </ul>
      </section>

      {SERVICE_PRICING.map((s) => (
        <section key={s.slug} className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold">{s.shortName}</h2>
            <Link to={s.path as never} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Подробно об услуге →
            </Link>
          </div>
          <p className="text-muted-foreground">{s.lead}</p>

          <div className="space-y-4">
            {s.groups.map((g) => (
              <PriceTable key={g.title} group={g} />
            ))}
          </div>

          {s.packages.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {s.packages.map((p) => (
                <article key={p.title} className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.subtitle}</p>
                  <ul className="mt-3 space-y-1 text-sm text-foreground/90">
                    {p.scope.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                  <dl className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Стоимость работ</dt>
                      <dd className="font-semibold text-primary">{formatRub(p.workTotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Материалы</dt>
                      <dd className="text-muted-foreground">покупает заказчик</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Срок</dt>
                      <dd>{p.term}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ))}

      <InfoSection title="Что влияет на итоговую сумму">
        <p>
          Цена меняется только по причинам, которые перечислены в прайсе: толщина слоя, площадь объекта, удалённость от
          МКАД, работа по выходным и подъём материала без лифта. Никаких «выяснилось на месте» — замерщик фиксирует все
          надбавки до подписания сметы, и после этого сумма не растёт. Материалы в прайс не включены: их покупает заказчик, а закупку и доставку мы можем взять на себя по отдельной договорённости.
        </p>
        <p>
          Работы принимаются по замерам: штукатурка — правилом 2 м, стяжка — по уровню и простукиванием, электрика и
          сантехника — с фотоотчётом трасс и опрессовкой.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/kalkulyator-stoimosti"
            className="inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Рассчитать стоимость
          </Link>
          <Link
            to="/contacts"
            className="inline-flex rounded-lg border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary"
          >
            Вызвать замерщика
          </Link>
        </div>
      </InfoSection>
    </InfoPageLayout>
  );
}
