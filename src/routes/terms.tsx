import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Пользовательское соглашение — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Пользовательское соглашение"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Документы" },
        { label: "Пользовательское соглашение" },
      ]}
    />
  );
}
