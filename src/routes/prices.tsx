import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/prices")({
  head: () => ({
    meta: [
      { title: "Цены — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/prices" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Цены"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Информация" },
        { label: "Цены" },
      ]}
    />
  );
}
