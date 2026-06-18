import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useId, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PriceConditions } from "@/components/prices/PriceConditions";
import { PriceTable } from "@/components/prices/PriceTable";
import { PriceModeToggle } from "@/components/prices/PriceModeToggle";
import { PriceCoefficients } from "@/components/prices/PriceCoefficients";
import { PricePackageCard } from "@/components/prices/PricePackageCard";
import { ServiceEstimateExample } from "@/components/services/ServiceEstimateExample";
import { EstimateForm } from "@/components/forms/EstimateForm";
import { Button } from "@/components/ui/button";

import { getPricesByCategory } from "@/data/prices";
import { REPAIR_PACKAGES } from "@/data/repair-packages";
import { HOUSE_TECHNOLOGIES, HOUSE_COMPLETION_LEVELS } from "@/data/house-technologies";
import { formatRubles, formatActualDate } from "@/lib/format-price";

const TITLE = "Цены на строительство и ремонт в Москве — Шадов и партнёры";
const DESCRIPTION =
  "Ориентировочные цены на строительство домов, ремонт квартир, монолитные, кладочные, кровельные, электромонтажные, сантехнические, отопительные и плиточные работы в Москве и Московской области.";
const URL = "https://shadov.pro/prices";

export const Route = createFileRoute("/prices")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Главная", item: "https://shadov.pro/" },
            { "@type": "ListItem", position: 2, name: "Цены",   item: URL },
          ],
        }),
      },
    ],
  }),
  component: PricesPage,
});

// ───────────────────────────────────────────────────────────────────────────
// Группы навигации (§5 запроса)
// ───────────────────────────────────────────────────────────────────────────
const NAV_GROUPS: { title: string; items: { id: string; label: string }[] }[] = [
  {
    title: "Ремонт",
    items: [
      { id: "repair_packages",    label: "Пакеты ремонта" },
      { id: "additional_repairs", label: "Дополнительные варианты" },
      { id: "finishing",          label: "Отделочные работы" },
      { id: "demolition",         label: "Демонтаж" },
    ],
  },
  {
    title: "Строительство",
    items: [
      { id: "houses",              label: "Дома" },
      { id: "monolithic",          label: "Монолит" },
      { id: "foundations",         label: "Фундаменты" },
      { id: "masonry",             label: "Кладка" },
      { id: "roofing",             label: "Кровля" },
      { id: "facades",             label: "Фасады" },
      { id: "general_contracting", label: "Генеральный подряд" },
    ],
  },
  {
    title: "Инженерные системы",
    items: [
      { id: "electrical",         label: "Электрика" },
      { id: "plumbing",           label: "Сантехника" },
      { id: "water_supply",       label: "Водоснабжение" },
      { id: "heating",            label: "Отопление" },
      { id: "underfloor_heating", label: "Тёплый пол" },
      { id: "tiling",             label: "Плитка" },
    ],
  },
];

// ───────────────────────────────────────────────────────────────────────────
// FAQ по ценам (§16) — ответы дословно из утверждённых положений ТЗ.
// ───────────────────────────────────────────────────────────────────────────
const PRICE_FAQ: { q: string; a: string }[] = [
  { q: "Можно ли узнать точную стоимость без выезда?", a: "Предварительная оценка возможна по проекту, фотографиям и описанию объекта. Точная стоимость определяется после изучения проекта, обследования объекта и подготовки сметы." },
  { q: "Что входит в указанную цену?",                 a: "По умолчанию указана стоимость работ. Состав каждой позиции уточняется на странице соответствующей услуги и в смете." },
  { q: "Включены ли материалы?",                       a: "Цены указаны за работы. Материалы рассчитываются отдельно, если иное прямо не предусмотрено выбранной комплектацией (например, варианты «под ключ с базовыми материалами»)." },
  { q: "Фиксируется ли стоимость в договоре?",         a: "Стоимость работ по согласованной смете фиксируется в договоре. Изменения возможны только через дополнительные соглашения по подтверждённым дополнительным работам." },
  { q: "Как оплачиваются работы?",                     a: "Каждый этап имеет отдельную стоимость. Аванс перечисляется только на текущий этап, следующий этап оплачивается после приёмки предыдущего." },
  { q: "Как оформляются дополнительные работы?",       a: "Дополнительные работы согласуются и оформляются отдельным соглашением с уточнением объёма, стоимости и срока." },
  { q: "Почему стоимость может измениться?",           a: "Изменения возможны только при изменении состава или объёма работ, выбранной комплектации либо организационных условий объекта. Все изменения оформляются документально." },
  { q: "Можно ли заказать только отдельную работу?",   a: "Да. Отдельные виды работ выполняются по тому же договорному и контрольному порядку, что и комплексные объекты." },
];

// ───────────────────────────────────────────────────────────────────────────
// Связанные направления (§страница «Цены»)
// ───────────────────────────────────────────────────────────────────────────
const RELATED: { to: string; label: string }[] = [
  { to: "/stroitelstvo",         label: "Строительство" },
  { to: "/remont",               label: "Ремонт" },
  { to: "/inzhenernye-sistemy",  label: "Инженерные системы" },
  { to: "/generalnyy-podryad",   label: "Генеральный подряд" },
  { to: "/how-we-work",          label: "Как мы работаем" },
  { to: "/sro-i-dokumenty",      label: "СРО и документы" },
];

// ───────────────────────────────────────────────────────────────────────────
// Локальные хелперы
// ───────────────────────────────────────────────────────────────────────────
function Section({ id, title, intro, children }: { id: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section
      id={id}
      style={{ scrollMarginTop: "96px" }}
      className="border-b border-border py-10 md:py-14"
    >
      <div className="container-page space-y-6">
        <header className="space-y-2">
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
          {intro ? <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{intro}</p> : null}
        </header>
        {children}
      </div>
    </section>
  );
}

function scrollToForm() {
  if (typeof document === "undefined") return;
  const el = document.getElementById("prices-estimate-form");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ───────────────────────────────────────────────────────────────────────────
// Страница
// ───────────────────────────────────────────────────────────────────────────
function PricesPage() {
  const [houseMode, setHouseMode] = useState<"work" | "work_and_basic_materials">("work");
  const faqHeadingId = useId();

  const monolithic    = getPricesByCategory("monolithic");
  const foundations   = getPricesByCategory("foundations");
  const masonry       = getPricesByCategory("masonry");
  const roofingAll    = getPricesByCategory("roofing");
  const roofingIndiv  = roofingAll.filter((p) => !p.id.startsWith("roofing-complex-"));
  const roofingComplex = roofingAll.filter((p) => p.id.startsWith("roofing-complex-"));
  const facades       = getPricesByCategory("facades");
  const gc            = getPricesByCategory("general_contracting");
  const elecPkg       = getPricesByCategory("electrical_packages");
  const elec          = getPricesByCategory("electrical");
  const plumbPkg      = getPricesByCategory("plumbing_packages");
  const plumb         = getPricesByCategory("plumbing");
  const water         = getPricesByCategory("water_supply");
  const heatPkg       = getPricesByCategory("heating_packages");
  const heat          = getPricesByCategory("heating");
  const ufh           = getPricesByCategory("underfloor_heating");
  const tiling        = getPricesByCategory("tiling");
  const finWalls      = getPricesByCategory("finishing_walls");
  const finFloors     = getPricesByCategory("finishing_floors");
  const finCeilings   = getPricesByCategory("finishing_ceilings");
  const finDoors      = getPricesByCategory("finishing_doors");
  const additionalRep = getPricesByCategory("additional_repairs");
  const demolition    = getPricesByCategory("demolition");

  // Демо-пример сметы: 5 позиций из категории сантехники.
  const estimateRows = [
    { id: "plumbing-tochka-vody",         volume: 8  },
    { id: "plumbing-tochka-kanalizatsii", volume: 5  },
    { id: "plumbing-installyatsiya",      volume: 1  },
    { id: "plumbing-podvesnoy-unitaz",    volume: 1  },
    { id: "plumbing-opressovka",          volume: 1  },
  ]
    .map((r) => {
      const item = plumb.find((p) => p.id === r.id);
      return item ? { item, volume: r.volume, note: "Демонстрационный объём" } : null;
    })
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const turnkeyExcluded = HOUSE_COMPLETION_LEVELS.find((l) => l.id === "turnkey")?.excluded ?? [];

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex-1 surface-light">
        {/* ── Первый экран ─────────────────────────────────────────── */}
        <section className="border-b border-border bg-background">
          <div className="container-page py-10 md:py-14">
            <Breadcrumbs
              items={[
                { label: "Главная", to: "/" },
                { label: "Цены" },
              ]}
              className="mb-6"
            />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Прайс</p>
            <h1 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl md:text-[44px]">
              Цены на строительство, ремонт и инженерные работы
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Ориентировочные расценки на работы строительной компании «Шадов и партнёры» в Москве и Московской области.
              Точная стоимость определяется после изучения проекта, обследования объекта и подготовки подробной сметы.
            </p>
            <ul className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 md:max-w-3xl md:grid-cols-3">
              {[
                "Цены указаны «от»",
                "По умолчанию — стоимость работ",
                "Материалы рассчитываются отдельно",
                "Каждый этап имеет отдельную стоимость",
                "Итоговая цена фиксируется в смете и договоре",
                `Дата актуализации — ${formatActualDate("2026-06").toLowerCase()}`,
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="min-h-11">
                <a href="#prices-estimate-form" onClick={(e) => { e.preventDefault(); scrollToForm(); }}>
                  Получить предварительный расчёт
                </a>
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="min-h-11"
                onClick={scrollToForm}
              >
                Отправить проект
              </Button>
              <Button asChild size="lg" variant="ghost" className="min-h-11">
                <Link to="/stroitelstvo">Посмотреть услуги</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Дисклеймер ──────────────────────────────────────────── */}
        <section className="border-b border-border py-8">
          <div className="container-page">
            <PriceConditions />
          </div>
        </section>

        {/* ── Якорная навигация (§5) ──────────────────────────────── */}
        <section className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
          <div className="container-page py-3">
            <nav aria-label="Категории прайса" className="overflow-x-auto">
              <div className="flex min-w-max gap-6 whitespace-nowrap">
                {NAV_GROUPS.map((g) => (
                  <div key={g.title} className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.title}:</span>
                    <ul className="flex gap-1">
                      {g.items.map((it) => (
                        <li key={it.id}>
                          <a
                            href={`#${it.id}`}
                            className="inline-flex min-h-9 items-center rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            {it.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>
          </div>
        </section>

        {/* ── 6.1 Пакеты ремонта ──────────────────────────────────── */}
        <Section id="repair_packages" title="Пакеты комплексного ремонта"
          intro="Семь утверждённых пакетов. Подробный состав указывается на странице услуги после согласования комплектации.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REPAIR_PACKAGES.map((pkg) => (
              <PricePackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Подробный состав пакета будет указан на странице услуги после утверждения комплектации.
          </p>
        </Section>

        {/* ── 6.2 Дополнительные варианты ремонта ─────────────────── */}
        <Section id="additional_repairs" title="Дополнительные варианты ремонта">
          <PriceTable caption="Дополнительные варианты ремонта" items={additionalRep} />
        </Section>

        {/* ── 7. Строительство домов ──────────────────────────────── */}
        <Section
          id="houses"
          title="Строительство домов"
          intro="Девять технологий и четыре уровня готовности. Переключатель меняет только этот блок и не влияет на другие таблицы."
        >
          <div className="flex flex-wrap items-center gap-3">
            <PriceModeToggle value={houseMode} onChange={setHouseMode} hasMaterials />
            <span className="text-xs text-muted-foreground">
              {houseMode === "work"
                ? "Показаны цены только за работы."
                : "Показаны цены за работы и базовые материалы для уровня «Под ключ»."}
            </span>
          </div>

          {houseMode === "work" ? (
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="sr-only">Цены на строительство домов — только работы</caption>
                <thead className="bg-[color:var(--surface-medium)] text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3">Технология</th>
                    <th scope="col" className="px-4 py-3">Коробка</th>
                    <th scope="col" className="px-4 py-3">Тёплый контур</th>
                    <th scope="col" className="px-4 py-3">Под чистовую отделку</th>
                    <th scope="col" className="px-4 py-3">Под ключ</th>
                  </tr>
                </thead>
                <tbody>
                  {HOUSE_TECHNOLOGIES.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <th scope="row" className="px-4 py-3 font-medium">
                        <Link to={`/${t.slug}` as string as never} className="hover:text-primary">{t.name}</Link>
                      </th>
                      <td className="px-4 py-3 font-semibold">от {formatRubles(t.workPrices.shell)}/м² площади дома</td>
                      <td className="px-4 py-3 font-semibold">от {formatRubles(t.workPrices.warmShell)}/м² площади дома</td>
                      <td className="px-4 py-3 font-semibold">от {formatRubles(t.workPrices.preFinish)}/м² площади дома</td>
                      <td className="px-4 py-3 font-semibold">от {formatRubles(t.workPrices.turnkey)}/м² площади дома</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full min-w-[480px] text-left text-sm">
                <caption className="sr-only">Цены на строительство домов — работы и базовые материалы</caption>
                <thead className="bg-[color:var(--surface-medium)] text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3">Технология</th>
                    <th scope="col" className="px-4 py-3">Под ключ с базовыми материалами</th>
                  </tr>
                </thead>
                <tbody>
                  {HOUSE_TECHNOLOGIES.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <th scope="row" className="px-4 py-3 font-medium">
                        <Link to={`/${t.slug}` as string as never} className="hover:text-primary">{t.name}</Link>
                      </th>
                      <td className="px-4 py-3 font-semibold">от {formatRubles(t.turnkeyWithBasicMaterials)}/м² площади дома</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <details className="rounded-lg border border-border bg-card p-4">
            <summary className="cursor-pointer text-sm font-medium">Что входит в каждый уровень готовности</summary>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {HOUSE_COMPLETION_LEVELS.map((l) => (
                <li key={l.id} className="rounded-md border border-border/60 bg-background p-3 text-sm">
                  <p className="font-medium">{l.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Состав уровня публикуется после утверждения текстов §16 ТЗ.
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs leading-relaxed text-muted-foreground">
              В базовую комплектацию «под ключ» отдельно рассчитываются:
              <ul className="mt-2 list-disc pl-5">
                {turnkeyExcluded.map((x) => <li key={x}>{x}</li>)}
              </ul>
            </div>
          </details>
        </Section>

        {/* ── Монолит / Фундаменты / Кладка ───────────────────────── */}
        <Section id="monolithic" title="Монолитные работы">
          <PriceTable caption="Монолитные работы" items={monolithic} />
        </Section>
        <Section id="foundations" title="Фундаменты">
          <PriceTable caption="Фундаменты" items={foundations} />
        </Section>
        <Section id="masonry" title="Кладочные работы">
          <PriceTable caption="Кладочные работы" items={masonry} />
        </Section>

        {/* ── Кровля: разделение по subgroup через ID ─────────────── */}
        <Section id="roofing" title="Кровельные работы"
          intro="Отдельно — стоимости работ по элементам кровли. Ниже — комплексные цены на готовые кровельные решения.">
          <div className="space-y-3">
            <h3 className="font-display text-lg font-semibold">Отдельные работы</h3>
            <PriceTable caption="Отдельные кровельные работы" items={roofingIndiv} />
          </div>
          <div className="space-y-3 pt-4">
            <h3 className="font-display text-lg font-semibold">Комплексные варианты кровли</h3>
            <PriceTable caption="Комплексные варианты кровли" items={roofingComplex} />
          </div>
        </Section>

        <Section id="facades" title="Фасадные работы">
          <PriceTable caption="Фасадные работы" items={facades} />
        </Section>

        {/* ── Генеральный подряд ──────────────────────────────────── */}
        <Section id="general_contracting" title="Генеральный подряд"
          intro="Проценты считаются от стоимости строительно-монтажных работ. Роли с фиксированной месячной оплатой указаны отдельно.">
          <PriceTable caption="Генеральный подряд" items={gc} />
        </Section>

        {/* ── Электромонтаж ───────────────────────────────────────── */}
        <Section id="electrical" title="Электромонтаж"
          intro="Сначала три комплексных пакета, ниже — отдельные работы по составу.">
          <div>
            <h3 className="font-display text-lg font-semibold">Пакеты электромонтажа</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {elecPkg.map((p) => (
                <article key={p.id} className="rounded-lg border border-border bg-card p-4">
                  <p className="font-medium">{p.name}</p>
                  <p className="mt-1 text-sm text-primary">от {formatRubles(p.priceFrom ?? 0)}/м²</p>
                </article>
              ))}
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <h3 className="font-display text-lg font-semibold">Отдельные работы</h3>
            <PriceTable caption="Отдельные электромонтажные работы" items={elec} />
          </div>
        </Section>

        {/* ── Сантехника ──────────────────────────────────────────── */}
        <Section id="plumbing" title="Сантехнические работы"
          intro="Сначала комплексные пакеты по квартире или дому, ниже — отдельные работы.">
          <div className="space-y-3">
            <h3 className="font-display text-lg font-semibold">Пакеты сантехники</h3>
            <PriceTable caption="Пакеты сантехнических работ" items={plumbPkg} />
          </div>
          <div className="space-y-3 pt-2">
            <h3 className="font-display text-lg font-semibold">Отдельные работы</h3>
            <PriceTable caption="Отдельные сантехнические работы" items={plumb} />
          </div>
        </Section>

        {/* ── Водоснабжение и канализация ─────────────────────────── */}
        <Section id="water_supply" title="Водоснабжение и канализация частного дома">
          <PriceTable caption="Водоснабжение и канализация частного дома" items={water} />
        </Section>

        {/* ── Отопление ───────────────────────────────────────────── */}
        <Section id="heating" title="Отопление"
          intro="Шесть комплексных пакетов и отдельные работы котельной, разводки и пусконаладки.">
          <div className="space-y-3">
            <h3 className="font-display text-lg font-semibold">Пакеты отопления</h3>
            <PriceTable caption="Пакеты отопления" items={heatPkg} />
          </div>
          <div className="space-y-3 pt-2">
            <h3 className="font-display text-lg font-semibold">Отдельные работы</h3>
            <PriceTable caption="Отдельные работы по отоплению" items={heat} />
          </div>
        </Section>

        {/* ── Тёплый пол ──────────────────────────────────────────── */}
        <Section id="underfloor_heating" title="Тёплый пол">
          <PriceTable caption="Тёплый пол" items={ufh} />
        </Section>

        {/* ── Плитка ──────────────────────────────────────────────── */}
        <Section id="tiling" title="Плиточные работы">
          <PriceTable caption="Плиточные работы" items={tiling} />
        </Section>

        {/* ── Отделочные работы (4 details) ───────────────────────── */}
        <Section id="finishing" title="Отделочные работы"
          intro="Стены, полы, потолки и двери. Раскройте раздел, чтобы увидеть таблицу.">
          <div className="space-y-3">
            {[
              { id: "finishing_walls",    title: "Стены",   items: finWalls    },
              { id: "finishing_floors",   title: "Полы",    items: finFloors   },
              { id: "finishing_ceilings", title: "Потолки", items: finCeilings },
              { id: "finishing_doors",    title: "Двери",   items: finDoors    },
            ].map((g) => (
              <details key={g.id} id={g.id} className="rounded-lg border border-border bg-card">
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
                  {g.title} <span className="text-muted-foreground">({g.items.length})</span>
                </summary>
                <div className="border-t border-border p-3">
                  <PriceTable caption={g.title} items={g.items} showActualDate={false} />
                </div>
              </details>
            ))}
          </div>
        </Section>

        {/* ── Демонтаж ────────────────────────────────────────────── */}
        <Section id="demolition" title="Демонтажные работы">
          <PriceTable caption="Демонтажные работы" items={demolition} />
        </Section>

        {/* ── 11. Условия применения базовых расценок ─────────────── */}
        <Section id="base-conditions" title="Условия применения базовых расценок">
          <ul className="grid gap-2 text-sm md:grid-cols-2">
            {[
              "Достаточный объём работ",
              "Свободный доступ на объект",
              "Наличие электричества и воды",
              "Высота помещений до 3 метров",
              "Отсутствие ручного подъёма материалов",
              "Стандартная геометрия",
              "Обычные сроки",
              "Отсутствие зимнего прогрева",
              "Возможность механизированной доставки материалов",
            ].map((c) => (
              <li key={c} className="flex items-start gap-2 rounded-md border border-border bg-card p-3">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ── 12. Повышающие коэффициенты ─────────────────────────── */}
        <Section id="coefficients" title="Повышающие коэффициенты"
          intro="Эти коэффициенты не применяются к ценам автоматически. Полноценный калькулятор появится позже и учтёт их по согласованным условиям объекта.">
          <PriceCoefficients />
        </Section>

        {/* ── 13. Как формируется точная смета ────────────────────── */}
        <Section id="estimate-process" title="Как формируется точная смета">
          <ol className="grid gap-3 md:grid-cols-2">
            {[
              "Получение проекта, планов или описания задачи.",
              "Предварительное определение состава работ.",
              "Выезд и обследование объекта.",
              "Расчёт объёмов, технологии и организационных условий.",
              "Подготовка подробной сметы и графика этапов.",
            ].map((step, i) => (
              <li key={step} className="rounded-md border border-border bg-card p-4 text-sm">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <p className="mt-2 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted-foreground">
            Точная смета формируется по фактическим объёмам и согласованному составу работ. Любые дополнительные работы оформляются и согласовываются отдельно.
          </p>
        </Section>

        {/* ── 14. Пример структуры сметы ──────────────────────────── */}
        <ServiceEstimateExample rows={estimateRows} />

        {/* ── 15. DEMO-форма ──────────────────────────────────────── */}
        <section id="prices-estimate-form" style={{ scrollMarginTop: "96px" }} className="border-b border-border py-12">
          <div className="container-page max-w-4xl space-y-6">
            <header className="space-y-2">
              <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Форма предварительного расчёта</h2>
              <p className="text-sm text-muted-foreground md:text-base">
                Опишите задачу — мы свяжемся, уточним детали и подготовим предварительную оценку. На этом этапе форма работает в демонстрационном режиме.
              </p>
            </header>
            <EstimateForm />
          </div>
        </section>

        {/* ── 16. FAQ ─────────────────────────────────────────────── */}
        <section aria-labelledby={faqHeadingId} id="faq" className="border-b border-border py-12">
          <div className="container-page max-w-4xl space-y-6">
            <h2 id={faqHeadingId} className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Частые вопросы по ценам
            </h2>
            <div className="space-y-2">
              {PRICE_FAQ.map((f, i) => (
                <details key={i} className="group rounded-lg border border-border bg-card">
                  <summary className="flex cursor-pointer items-start justify-between gap-3 px-4 py-3 text-sm font-medium">
                    <span>{f.q}</span>
                    <ChevronRight aria-hidden="true" className="mt-0.5 h-4 w-4 flex-none text-muted-foreground transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="border-t border-border px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Связанные направления ───────────────────────────────── */}
        <section className="border-b border-border py-10">
          <div className="container-page space-y-4">
            <h2 className="font-display text-xl font-semibold tracking-tight md:text-2xl">Связанные направления</h2>
            <ul className="flex flex-wrap gap-2">
              {RELATED.map((r) => (
                <li key={r.to}>
                  <Link
                    to={r.to}
                    className="inline-flex min-h-9 items-center rounded-full border border-border bg-card px-4 text-sm text-foreground transition-colors hover:border-primary/60 hover:text-primary"
                  >
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Повтор дисклеймера ──────────────────────────────────── */}
        <section className="py-8">
          <div className="container-page">
            <PriceConditions />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
