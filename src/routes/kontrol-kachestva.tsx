import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/kontrol-kachestva")({
  head: () => ({
    meta: [
      { title: "Контроль качества — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/kontrol-kachestva" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Контроль качества"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Информация" },
        { label: "Контроль качества" },
      ]}
    />
  );
}
