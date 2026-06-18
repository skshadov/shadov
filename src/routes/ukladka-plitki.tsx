import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/ukladka-plitki")({
  head: () => ({
    meta: [
      { title: "Укладка плитки — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/ukladka-plitki" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Укладка плитки"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Инженерные системы" },
        { label: "Укладка плитки" },
      ]}
    />
  );
}
