import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  getPublishedServiceBySlug,
  type PublicCategory,
  type PublicService,
} from "@/lib/catalog-public.functions";

export const Route = createFileRoute("/catalog/$category/$service")({
  loader: async ({ params }) => {
    const res = await getPublishedServiceBySlug({ data: { slug: params.service } });
    if (!res.service) throw notFound();
    if (res.category && res.category.slug !== params.category) throw notFound();
    return res;
  },
  head: ({ loaderData }) => {
    const svc = (loaderData as { service: PublicService | null } | undefined)?.service;
    const title = svc?.seo_title || svc?.title || "Услуга";
    const description = svc?.seo_description || svc?.summary || "";
    return {
      meta: [
        { title: `${title} — Шадов и партнёры` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ServicePage,
  errorComponent: () => <Fallback title="Услуга недоступна" />,
  notFoundComponent: () => <Fallback title="Услуга не найдена" />,
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

function ServicePage() {
  const { service, category } = Route.useLoaderData() as {
    service: PublicService;
    category: PublicCategory | null;
  };
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Главная", to: "/" },
            { label: "Каталог", to: "/catalog" },
            ...(category
              ? [{ label: category.title, to: `/catalog/${category.slug}` }]
              : []),
            { label: service.title },
          ]}
        />
        <h1 className="mt-4 text-3xl font-semibold">{service.title}</h1>
        {service.summary ? (
          <p className="mt-2 max-w-3xl text-muted-foreground">{service.summary}</p>
        ) : null}
        {service.base_price != null ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Базовая цена: от {Number(service.base_price).toLocaleString("ru-RU")} {service.currency}
            {service.price_unit ? ` / ${service.price_unit}` : ""}
          </p>
        ) : null}
        {service.body_md ? (
          <article className="prose prose-neutral mt-8 max-w-3xl whitespace-pre-wrap text-foreground">
            {service.body_md}
          </article>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}