import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/elektromontazh")({
  head: () => ({
    meta: [
      { title: "Электромонтаж — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/elektromontazh" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Электромонтаж"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Инженерные системы" },
        { label: "Электромонтаж" },
      ]}
    />
  );
}
