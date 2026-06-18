import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Наши работы — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/portfolio" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Наши работы"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Информация" },
        { label: "Наши работы" },
      ]}
    />
  );
}
