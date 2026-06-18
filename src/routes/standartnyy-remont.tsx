import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/standartnyy-remont")({
  head: () => ({
    meta: [
      { title: "Стандартный ремонт — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/standartnyy-remont" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Стандартный ремонт"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Ремонт" },
        { label: "Стандартный ремонт" },
      ]}
    />
  );
}
