import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/karkasnye-doma")({
  head: () => ({
    meta: [
      { title: "Каркасные дома — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/karkasnye-doma" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Каркасные дома"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Каркасные дома" },
      ]}
    />
  );
}
