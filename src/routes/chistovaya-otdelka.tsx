import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/chistovaya-otdelka")({
  head: () => ({
    meta: [
      { title: "Чистовая отделка — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/chistovaya-otdelka" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Чистовая отделка"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Ремонт" },
        { label: "Чистовая отделка" },
      ]}
    />
  );
}
