import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/stroitelstvo-domov-pod-klyuch")({
  head: () => ({
    meta: [
      { title: "Строительство частных домов под ключ — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/stroitelstvo-domov-pod-klyuch" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Строительство частных домов под ключ"
      shortLabel="Дома под ключ"
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Строительство частных домов под ключ" },
      ]}
    />
  );
}
