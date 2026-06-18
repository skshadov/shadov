import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/teplyy-pol")({
  head: () => ({
    meta: [
      { title: "Тёплый пол — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/teplyy-pol" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Тёплый пол"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Инженерные системы" },
        { label: "Тёплый пол" },
      ]}
    />
  );
}
