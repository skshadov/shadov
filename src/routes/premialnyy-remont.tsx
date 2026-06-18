import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/premialnyy-remont")({
  head: () => ({
    meta: [
      { title: "Премиальный ремонт — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/premialnyy-remont" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Премиальный ремонт"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Ремонт" },
        { label: "Премиальный ремонт" },
      ]}
    />
  );
}
