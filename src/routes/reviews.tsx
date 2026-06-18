import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Отзывы — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/reviews" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Отзывы"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Информация" },
        { label: "Отзывы" },
      ]}
    />
  );
}
