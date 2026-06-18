import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Политика использования cookies — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/cookies" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Политика использования cookies"
      shortLabel="Cookies"
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Документы" },
        { label: "Политика использования cookies" },
      ]}
    />
  );
}
