import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/doma-iz-kleenogo-brusa")({
  head: () => ({
    meta: [
      { title: "Дома из клееного бруса — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/doma-iz-kleenogo-brusa" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Дома из клееного бруса"
      
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Строительство" },
        { label: "Дома из клееного бруса" },
      ]}
    />
  );
}
