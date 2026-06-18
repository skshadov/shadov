import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/generalnyy-podryad")({
  head: () => ({
    meta: [
      { title: "Генеральный подряд — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/generalnyy-podryad" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Генеральный подряд"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Генеральный подряд" },
      ]}
    />
  );
}
