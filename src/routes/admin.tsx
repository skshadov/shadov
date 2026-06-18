import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Административная панель — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/admin" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Административная панель"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Личный кабинет" },
        { label: "Административная панель" },
      ]}
    />
  );
}
