import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { getProject, getSimilar, type FloorKey } from "@/data/projects";
import { MATERIAL_LABEL, MATERIAL_SERVICE_SLUG } from "@/data/projects-pricing";
import { ProjectCover } from "@/components/projects/ProjectCover";
import { ProjectFloorPlan } from "@/components/projects/ProjectFloorPlan";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CostByMaterials } from "@/components/projects/CostByMaterials";
import { FlexibilityNote } from "@/components/projects/FlexibilityNote";
import { EstimateSection } from "@/components/home/EstimateSection";

export const Route = createFileRoute("/proekty/$slug")({
  loader: ({ params }) => {
    const project = getProject(params.slug);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.project;
    if (!p) return {};
    const url = `https://shadov.pro/proekty/${p.slug}`;
    return {
      meta: [
        { title: `${p.title} — проект ${p.slug} | Шадов и партнёры` },
        { name: "description", content: p.metaDescription },
        { property: "og:title", content: p.title },
        { property: "og:description", content: p.metaDescription },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Главная", item: "https://shadov.pro/" },
              { "@type": "ListItem", position: 2, name: "Проекты домов", item: "https://shadov.pro/proekty" },
              { "@type": "ListItem", position: 3, name: p.title, item: url },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.title,
            sku: p.slug,
            description: p.metaDescription,
            brand: { "@type": "Organization", name: "Шадов и партнёры" },
            category: "Проект дома под ключ",
            url,
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Проект не найден</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">Такого артикула нет в каталоге</h1>
      <Link to="/proekty" className="mt-6 inline-block text-primary underline-offset-4 hover:underline">
        Вернуться в каталог
      </Link>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="container-page py-20 text-center">
      <h1 className="font-display text-2xl font-semibold">Не удалось загрузить проект</h1>
      <p className="mt-2 text-sm text-muted-foreground">{(error as Error).message}</p>
      <button onClick={reset} className="mt-6 rounded-md border border-border px-4 py-2 text-sm">Повторить</button>
    </div>
  ),
  component: ProjectPage,
});

function ProjectPage() {
  const { project: p } = Route.useLoaderData();
  const floors: FloorKey[] = uniqueFloors(p.rooms.map((r) => r.floor));
  const [floor, setFloor] = useState<FloorKey>(floors[0]);
  const similar = getSimilar(p);
  const floorsLabel = p.floors === 1 ? "1 этаж" : p.floors === 1.5 ? "С мансардой" : "2 этажа";

  return (
    <main id="main">
      <section className="surface-light border-b border-border">
        <div className="container-page py-8 md:py-12">
          <nav aria-label="Хлебные крошки" className="text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Главная</Link>
            <span className="px-2">/</span>
            <Link to="/proekty" className="hover:text-foreground">Проекты домов</Link>
            <span className="px-2">/</span>
            <span className="text-foreground">{p.slug}</span>
          </nav>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <ProjectCover project={p} className="aspect-[4/3] w-full" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Проект {p.slug} · {MATERIAL_LABEL[p.primaryMaterial]}
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                {p.title}
              </h1>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                Проект бесплатно входит в стоимость строительства
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <Fact label="Общая площадь" value={`${p.area} м²`} />
                <Fact label="Жилая площадь" value={`${p.livingArea} м²`} />
                <Fact label="Габариты" value={`${p.width}×${p.depth} м`} />
                <Fact label="Этажность" value={floorsLabel} />
                <Fact label="Спальни" value={String(p.bedrooms)} />
                <Fact label="Санузлы" value={String(p.bathrooms)} />
              </dl>

              <a href="#estimate"
                className="mt-7 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Получить расчёт по проекту {p.slug}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="container-page py-12 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 className="font-display text-2xl font-semibold">Поэтажные планы</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Концептуальная схема расположения помещений. Точные чертежи с привязкой к участку и инженерным сетям выдаются после заключения договора — бесплатно.
              </p>
              {floors.length > 1 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {floors.map((f) => (
                    <button
                      key={String(f)}
                      onClick={() => setFloor(f)}
                      className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
                        floor === f
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:border-primary/50"
                      }`}
                    >
                      {floorLabel(f)}
                    </button>
                  ))}
                </div>
              )}

              <ul className="mt-6 space-y-1.5 text-sm">
                {p.rooms.filter((r) => r.floor === floor).map((r, i) => (
                  <li key={i} className="flex justify-between border-b border-dashed border-border pb-1.5">
                    <span className="text-foreground">{r.name}</span>
                    <span className="tabular-nums text-muted-foreground">{r.area} м²</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <ProjectFloorPlan project={p} floor={floor} className="h-auto w-full" />
            </div>
          </div>
        </div>
      </section>

      <section className="surface-light border-b border-border">
        <div className="container-page py-12 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <article className="max-w-none text-foreground">
              <h2 className="font-display text-2xl font-semibold">Описание проекта</h2>
              {p.description.map((para, i) => (
                <p key={i} className="mt-3 text-base leading-relaxed text-muted-foreground">{para}</p>
              ))}
            </article>

            <div className="space-y-6">
              <CostByMaterials area={p.area} materials={p.alsoBuildIn} />
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display text-base font-semibold">Подробнее об основном материале</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {MATERIAL_LABEL[p.primaryMaterial]} — основная технология проекта. На странице услуги — состав работ, гарантия, сроки и примеры объектов.
                </p>
                <Link
                  to={`/${MATERIAL_SERVICE_SLUG[p.primaryMaterial]}`}
                  className="mt-4 inline-flex text-sm text-primary underline-offset-4 hover:underline"
                >
                  Подробнее об услуге →
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <FlexibilityNote />
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="border-b border-border">
          <div className="container-page py-12 md:py-16">
            <h2 className="font-display text-2xl font-semibold">Похожие проекты</h2>
            <p className="mt-2 text-sm text-muted-foreground">Дома того же материала с близкой площадью.</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {similar.map((s) => (
                <ProjectCard key={s.slug} p={s} />
              ))}
            </div>
          </div>
        </section>
      )}

      <EstimateSection />
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}

function floorLabel(f: FloorKey): string {
  if (f === "mansard") return "Мансарда";
  if (f === 1) return "1 этаж";
  return "2 этаж";
}

function uniqueFloors(arr: FloorKey[]): FloorKey[] {
  const out: FloorKey[] = [];
  for (const f of arr) if (!out.includes(f)) out.push(f);
  return out.sort((a, b) => {
    const ord = (x: FloorKey) => (x === 1 ? 1 : x === 2 ? 2 : 3);
    return ord(a) - ord(b);
  });
}