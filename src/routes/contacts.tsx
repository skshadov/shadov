import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Контакты — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/contacts" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Контакты"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Информация" },
        { label: "Контакты" },
      ]}
    />
  );
}
