import { createFileRoute } from "@tanstack/react-router";
import { RouteStub } from "@/components/common/RouteStub";

export const Route = createFileRoute("/portfolio/$slug")({
  head: () => ({
    meta: [
      { title: "Объект портфолио — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел готовится." },
    ],
  }),
  component: Page,
});

function Page() {
  const params = Route.useParams() as Record<string, string>;
  const id = params["slug"];
  return (
    <RouteStub
      title="Объект портфолио"
      shortLabel={id ? `Идентификатор: ${id}` : undefined}
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Информация" },
        { label: "Объект портфолио" },
      ]}
      description="Раздел готовится. Подробные данные по объекту появятся после подключения защищённой базы данных на следующем этапе."
    />
  );
}
