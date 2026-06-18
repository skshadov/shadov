import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/kirpichnye-doma")({
  head: () => ({
    meta: [
      { title: "Кирпичные дома — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/kirpichnye-doma" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Кирпичные дома"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Кирпичные дома" },
      ]}
    />
  );
}
