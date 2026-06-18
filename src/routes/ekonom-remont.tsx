import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/ekonom-remont")({
  head: () => ({
    meta: [
      { title: "Эконом-ремонт — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/ekonom-remont" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Эконом-ремонт"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Ремонт" },
        { label: "Эконом-ремонт" },
      ]}
    />
  );
}
