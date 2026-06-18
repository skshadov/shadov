import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/mnogokvartirnye-doma")({
  head: () => ({
    meta: [
      { title: "Многоквартирные дома — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/mnogokvartirnye-doma" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Многоквартирные дома"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Многоквартирные дома" },
      ]}
    />
  );
}
