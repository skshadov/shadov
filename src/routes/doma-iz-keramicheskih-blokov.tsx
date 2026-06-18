import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/doma-iz-keramicheskih-blokov")({
  head: () => ({
    meta: [
      { title: "Дома из керамических блоков — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/doma-iz-keramicheskih-blokov" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Дома из керамических блоков"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Дома из керамических блоков" },
      ]}
    />
  );
}
