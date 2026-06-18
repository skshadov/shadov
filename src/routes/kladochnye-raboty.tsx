import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/kladochnye-raboty")({
  head: () => ({
    meta: [
      { title: "Кладочные работы — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/kladochnye-raboty" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Кладочные работы"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Кладочные работы" },
      ]}
    />
  );
}
