import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/biznes-remont")({
  head: () => ({
    meta: [
      { title: "Бизнес-ремонт — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/biznes-remont" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Бизнес-ремонт"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Ремонт" },
        { label: "Бизнес-ремонт" },
      ]}
    />
  );
}
