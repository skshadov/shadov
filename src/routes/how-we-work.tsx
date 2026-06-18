import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/how-we-work")({
  head: () => ({
    meta: [
      { title: "Как мы работаем — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/how-we-work" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Как мы работаем"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Информация" },
        { label: "Как мы работаем" },
      ]}
    />
  );
}
