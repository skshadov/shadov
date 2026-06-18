import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/kombinirovannye-doma")({
  head: () => ({
    meta: [
      { title: "Комбинированные дома — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/kombinirovannye-doma" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Комбинированные дома"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Комбинированные дома" },
      ]}
    />
  );
}
