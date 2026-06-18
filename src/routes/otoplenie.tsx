import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/otoplenie")({
  head: () => ({
    meta: [
      { title: "Отопление — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/otoplenie" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Отопление"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Инженерные системы" },
        { label: "Отопление" },
      ]}
    />
  );
}
