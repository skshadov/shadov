import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/krovelnye-raboty")({
  head: () => ({
    meta: [
      { title: "Кровельные работы — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/krovelnye-raboty" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Кровельные работы"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Кровельные работы" },
      ]}
    />
  );
}
