import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/monolitnye-doma")({
  head: () => ({
    meta: [
      { title: "Монолитные дома — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/monolitnye-doma" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Монолитные дома"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Монолитные дома" },
      ]}
    />
  );
}
