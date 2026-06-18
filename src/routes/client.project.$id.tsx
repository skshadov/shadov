import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/client/project/$id")({
  head: () => ({
    meta: [
      { title: "Проект в кабинете — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится." },
    ],
  }),
  component: Page,
});

function Page() {
  const params = Route.useParams() as Record<string, string>;
  const id = params["id"];
  return (
    <RouteStub
      title="Проект в кабинете"
      shortLabel={id ? `Идентификатор: ${id}` : undefined}
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Личный кабинет" },
        { label: "Проект в кабинете" },
      ]}
      description="Раздел готовится. Подробные данные по объекту появятся после подключения защищённой базы данных на следующем этапе."
    />
  );
}
