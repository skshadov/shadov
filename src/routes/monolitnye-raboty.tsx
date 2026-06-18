import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/monolitnye-raboty")({
  head: () => ({
    meta: [
      { title: "Монолитные работы — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/monolitnye-raboty" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Монолитные работы"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Монолитные работы" },
      ]}
    />
  );
}
