import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/client")({
  head: () => ({
    meta: [
      { title: "Личный кабинет — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/client" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Личный кабинет"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Личный кабинет" },
        { label: "Личный кабинет" },
      ]}
    />
  );
}
