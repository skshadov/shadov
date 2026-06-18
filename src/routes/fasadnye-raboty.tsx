import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/fasadnye-raboty")({
  head: () => ({
    meta: [
      { title: "Фасадные работы — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/fasadnye-raboty" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Фасадные работы"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Фасадные работы" },
      ]}
    />
  );
}
