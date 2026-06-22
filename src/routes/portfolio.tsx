import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";
import { PlaceholderNotice } from "@/components/common/PlaceholderNotice";
import { Button } from "@/components/ui/button";

const PATH = "/portfolio";
const TITLE = "Наши работы — Шадов и партнёры";
const DESC = "Раздел наполняется подтверждёнными материалами выполненных объектов. Фотографии и описание публикуются только после проверки и согласия на размещение.";

export const Route = createFileRoute("/portfolio")({
  head: () => buildInfoHead({
    title: TITLE, description: DESC, path: PATH,
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "Наши работы", path: PATH },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Наши работы" }]}
      h1="Наши работы"
      intro={
        <p>
          Раздел наполняется подтверждёнными материалами выполненных объектов.
          Названия, адреса, площади, бюджеты и фотографии публикуются только
          после проверки материалов и получения разрешения на размещение.
        </p>
      }
    >
      <InfoSection title="Что будет опубликовано">
        <ul className="list-disc space-y-2 pl-5">
          <li>Фотографии этапов и сданных объектов с разрешения заказчика</li>
          <li>Описание выполненных работ и применённых решений</li>
          <li>Сроки выполнения и характеристики объекта</li>
          <li>Фильтры по направлениям — после появления подтверждённых материалов</li>
        </ul>
      </InfoSection>
      <InfoSection title="Раздел готовится">
        <PlaceholderNotice
          title="Раздел наполняется подтверждёнными материалами выполненных объектов"
          description="Фотографии, описание работ, сроки и характеристики объекта публикуются только после проверки материалов и получения разрешения на размещение."
        />
        <div className="flex flex-wrap gap-3">
          <Button asChild className="min-h-11">
            <Link to="/kalkulyator-stoimosti">Открыть калькулятор</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/contacts">Оставить заявку на расчёт</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Подробнее об услугах —{" "}
          <Link to="/stroitelstvo" className="text-primary underline-offset-2 hover:underline">строительство</Link>
          {", "}
          <Link to="/remont" className="text-primary underline-offset-2 hover:underline">ремонт</Link>
          {", "}
          <Link to="/inzhenernye-sistemy" className="text-primary underline-offset-2 hover:underline">инженерные системы</Link>.
        </p>
      </InfoSection>
    </InfoPageLayout>
  );
}
