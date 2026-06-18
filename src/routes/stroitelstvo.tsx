import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/stroitelstvo")({
  head: () => ({
    meta: [
      { title: "Строительство — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/stroitelstvo" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Строительство"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Строительство" },
      ]}
    />
  );
}
