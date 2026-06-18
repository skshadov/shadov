import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/requisites")({
  head: () => ({
    meta: [
      { title: "Реквизиты — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/requisites" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Реквизиты"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Документы" },
        { label: "Реквизиты" },
      ]}
    />
  );
}
