import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/chernovoy-remont")({
  head: () => ({
    meta: [
      { title: "Черновой ремонт — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/chernovoy-remont" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Черновой ремонт"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Ремонт" },
        { label: "Черновой ремонт" },
      ]}
    />
  );
}
