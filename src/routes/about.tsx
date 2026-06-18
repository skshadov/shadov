import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "О компании — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="О компании"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Информация" },
        { label: "О компании" },
      ]}
    />
  );
}
