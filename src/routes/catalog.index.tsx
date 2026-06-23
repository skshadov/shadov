import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { listPublishedCategories, type PublicCategory } from "@/lib/catalog-public.functions";

const TITLE = "Каталог услуг — Шадов и партнёры";
const DESCRIPTION = "Категории строительных и ремонтных услуг компании Шадов и партнёры.";

export const Route = createFileRoute("/catalog/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  loader: () => listPublishedCategories(),
  component: CatalogIndex,
  errorComponent: () => <CatalogError />,
  notFoundComponent: () => <CatalogError />,
});

function CatalogError() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold">Каталог временно недоступен</h1>
        <p className="mt-2 text-muted-foreground">Попробуйте обновить страницу позже.</p>
      </main>
      <Footer />
    </div>
  );
}

function CatalogIndex() {
  const categories = Route.useLoaderData() as PublicCategory[];
  const roots = categories.filter((c: PublicCategory) => !c.parent_id);
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Главная", to: "/" },
            { label: "Каталог" },
          ]}
        />
        <h1 className="mt-4 text-3xl font-semibold">Каталог услуг</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">{DESCRIPTION}</p>

        {roots.length === 0 ? (
          <p className="mt-10 text-muted-foreground">Категории пока не опубликованы.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roots.map((cat) => (
              <Link
                key={cat.id}
                to="/catalog/$category"
                params={{ category: cat.slug }}
                className="block rounded-lg border bg-card p-5 transition-colors hover:border-foreground/40"
              >
                <h2 className="text-lg font-semibold">{cat.title}</h2>
                {cat.summary ? (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{cat.summary}</p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}