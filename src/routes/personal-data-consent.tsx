import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/personal-data-consent")({
  head: () => ({
    meta: [
      { title: "Согласие на обработку персональных данных — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта." },
    ],
    links: [{ rel: "canonical", href: "/personal-data-consent" }],
  }),
  component: Page,
});

function Page() {
  return (
    <RouteStub
      title="Согласие на обработку персональных данных"
      shortLabel="Согласие на ОПД"
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Документы" },
        { label: "Согласие на обработку персональных данных" },
      ]}
    />
  );
}
