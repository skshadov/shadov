import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/santehnika")({
  head: () => ({
    meta: [
      { title: "Сантехника — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/santehnika" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Сантехника"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Инженерные системы" },
        { label: "Сантехника" },
      ]}
    />
  );
}
