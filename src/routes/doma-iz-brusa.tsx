import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/doma-iz-brusa")({
  head: () => ({
    meta: [
      { title: "Дома из профилированного бруса — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/doma-iz-brusa" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Дома из профилированного бруса"
      shortLabel="Дома из бруса"
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Дома из профилированного бруса" },
      ]}
    />
  );
}
