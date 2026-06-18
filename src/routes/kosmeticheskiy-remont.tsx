import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/kosmeticheskiy-remont")({
  head: () => ({
    meta: [
      { title: "Косметический ремонт — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/kosmeticheskiy-remont" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Косметический ремонт"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Ремонт" },
        { label: "Косметический ремонт" },
      ]}
    />
  );
}
