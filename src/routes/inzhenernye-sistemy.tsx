import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/inzhenernye-sistemy")({
  head: () => ({
    meta: [
      { title: "Инженерные системы — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/inzhenernye-sistemy" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Инженерные системы"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Инженерные системы" },
        { label: "Инженерные системы" },
      ]}
    />
  );
}
