import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/sro-i-dokumenty")({
  head: () => ({
    meta: [
      { title: "СРО и документы — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/sro-i-dokumenty" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="СРО и документы"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Информация" },
        { label: "СРО и документы" },
      ]}
    />
  );
}
