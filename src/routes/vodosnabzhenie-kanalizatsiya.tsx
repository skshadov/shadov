import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/vodosnabzhenie-kanalizatsiya")({
  head: () => ({
    meta: [
      { title: "Водоснабжение и канализация — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/vodosnabzhenie-kanalizatsiya" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Водоснабжение и канализация"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Инженерные системы" },
        { label: "Водоснабжение и канализация" },
      ]}
    />
  );
}
