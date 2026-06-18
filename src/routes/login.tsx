import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Вход в личный кабинет — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/login" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Вход в личный кабинет"
      shortLabel="Личный кабинет"
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Личный кабинет" },
        { label: "Вход в личный кабинет" },
      ]}
    />
  );
}
