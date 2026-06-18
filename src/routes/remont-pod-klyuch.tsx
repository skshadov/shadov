import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/remont-pod-klyuch")({
  head: () => ({
    meta: [
      { title: "Ремонт под ключ — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/remont-pod-klyuch" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Ремонт под ключ"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Ремонт" },
        { label: "Ремонт под ключ" },
      ]}
    />
  );
}
