import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  getPublishedCategoryBySlug,
  type PublicCategory,
  type PublicService,
} from "@/lib/catalog-public.functions";

export const Route = createFileRoute("/catalog/$category")({
  loader: async ({ params }) => {
    const res = await getPublishedCategoryBySlug({ data: { slug: params.category } });
    if (!res.category) throw notFound();
    return res;
  },
  head: ({ loaderData }) => {
    const cat = (loaderData as { category: PublicCategory | null } | undefined)?.category;
    const title = cat?.seo_title || cat?.title || "Категория";
    const description = cat?.seo_description || cat?.summary || "";
    return {
      meta: [
        { title: `${title} — Шадов и партнёры` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CategoryPage,
  errorComponent: () => <Fallback title="Категория недоступна" />,
  notFoundComponent: () => <Fallback title="Категория не найдена" />,
});

function Fallback({ title }: { title: string }) {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2">
          <Link to="/catalog" className="text-primary underline">
            Вернуться к каталогу
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}

function CategoryPage() {
  const { category, services } = Route.useLoaderData() as {
    category: PublicCategory;
    services: PublicService[];
  };
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Главная", to: "/" },
            { label: "Каталог", to: "/catalog" },
            { label: category.title },
          ]}
        />
        <h1 className="mt-4 text-3xl font-semibold">{category.title}</h1>
        {category.summary ? (
          <p className="mt-2 max-w-3xl text-muted-foreground">{category.summary}</p>
        ) : null}

        {services.length === 0 ? (
          <p className="mt-10 text-muted-foreground">В этой категории пока нет услуг.</p>
        ) : (
          <ul className="mt-8 divide-y rounded-lg border bg-card">
            {services.map((svc) => (
              <li key={svc.id}>
                <Link
                  to="/catalog/$category/$service"
                  params={{ category: category.slug, service: svc.slug }}
                  className="flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-muted/40"
                >
                  <span className="text-base font-medium">{svc.title}</span>
                  {svc.summary ? (
                    <span className="line-clamp-2 text-sm text-muted-foreground">{svc.summary}</span>
                  ) : null}
                  {svc.base_price != null ? (
                    <span className="text-sm text-muted-foreground">
                      от {Number(svc.base_price).toLocaleString("ru-RU")} {svc.currency}
                      {svc.price_unit ? ` / ${svc.price_unit}` : ""}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}