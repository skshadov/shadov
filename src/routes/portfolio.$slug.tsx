import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection } from "@/components/info/InfoPageLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/portfolio/$slug")({
  head: () => ({
    meta: [
      { title: "Объект не найден — Шадов и партнёры" },
      { name: "robots", content: "noindex, follow" },
      { name: "description", content: "Раздел портфолио наполняется подтверждёнными материалами выполненных объектов." },
    ],
  }),
  // Подэтап 2.6: пока нет подтверждённых объектов — любой динамический slug
  // возвращает 404. Это исключает фиктивные карточки и индексацию пустых URL.
  loader: () => {
    throw notFound();
  },
  notFoundComponent: () => (
    <InfoPageLayout
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Наши работы", to: "/portfolio" },
        { label: "Объект не найден" },
      ]}
      h1="Объект не найден"
      intro={<p>Раздел портфолио наполняется подтверждёнными материалами выполненных объектов.</p>}
    >
      <InfoSection>
        <p>
          У нас пока нет публикуемых данных по этому идентификатору. Перейдите
          к списку направлений или откройте калькулятор предварительной стоимости.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="min-h-11">
            <Link to="/portfolio">Перейти в «Наши работы»</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/kalkulyator-stoimosti">Открыть калькулятор</Link>
          </Button>
        </div>
      </InfoSection>
    </InfoPageLayout>
  ),
  component: () => null,
});
