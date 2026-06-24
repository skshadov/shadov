import { createFileRoute, Link } from "@tanstack/react-router";
import { PROJECTS } from "@/data/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CatalogFilters, useFilteredProjects } from "@/components/projects/CatalogFilters";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const URL = "https://shadov.pro/proekty";
const TITLE = "Проекты домов под ключ — Шадов и партнёры";
const DESC =
  "Каталог из 160+ проектов: каркасные, СИП, газобетонные, кирпичные дома. Поэтажные планы и расчёт стоимости в разных материалах. Проект бесплатно входит в стоимость строительства.";

export const Route = createFileRoute("/proekty/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const { state, setState, list } = useFilteredProjects(PROJECTS);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex-1">
      <div className="container-page py-10 md:py-14">
        <nav aria-label="Хлебные крошки" className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Главная</Link>
          <span className="px-2">/</span>
          <span className="text-foreground">Проекты домов</span>
        </nav>

        <header className="mt-4 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Каталог проектов</p>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
            160+ проектов домов под ключ
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Каркасные, СИП, газобетонные и кирпичные дома — от компактных одноэтажных 60 м² до больших двухэтажных 320 м² со вторым светом, гаражом и спа-зоной. Цена проекта — 0 ₽: проект всегда входит в стоимость строительства.
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
          <CatalogFilters state={state} setState={setState} totalCount={list.length} />

          <section>
            {list.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                По вашим фильтрам ничего не найдено. Попробуйте сбросить часть условий.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((p) => (
                  <ProjectCard key={p.slug} p={p} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}