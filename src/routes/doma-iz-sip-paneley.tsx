import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/doma-iz-sip-paneley")({
  head: () => ({
    meta: [
      { title: "Дома из СИП-панелей — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/doma-iz-sip-paneley" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Дома из СИП-панелей"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Дома из СИП-панелей" },
      ]}
    />
  );
}
