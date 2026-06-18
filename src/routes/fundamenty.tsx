import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/fundamenty")({
  head: () => ({
    meta: [
      { title: "Фундаменты — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/fundamenty" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Фундаменты"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Фундаменты" },
      ]}
    />
  );
}
