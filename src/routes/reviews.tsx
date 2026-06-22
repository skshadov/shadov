import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";
import { PlaceholderNotice } from "@/components/common/PlaceholderNotice";

const PATH = "/reviews";
const TITLE = "Отзывы — Шадов и партнёры";
const DESC = "Отзывы публикуются только после проверки источника и согласия на размещение. Раздел не содержит вымышленных оценок.";

export const Route = createFileRoute("/reviews")({
  head: () => buildInfoHead({
    title: TITLE, description: DESC, path: PATH,
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "Отзывы", path: PATH },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Отзывы" }]}
      h1="Отзывы"
      intro={
        <p>
          Раздел наполняется подтверждёнными отзывами заказчиков. Отзыв
          публикуется только после проверки источника и согласия на размещение.
        </p>
      }
    >
      <InfoSection title="Что и как публикуется">
        <ul className="list-disc space-y-2 pl-5">
          <li>Отзывы заказчиков, подтвердивших факт выполнения работ</li>
          <li>Проверка источника отзыва до публикации</li>
          <li>Персональные данные размещаются только с согласия автора</li>
          <li>Модерация отзывов подключается на этапе административной панели</li>
        </ul>
      </InfoSection>
      <InfoSection title="Раздел готовится">
        <PlaceholderNotice
          title="Подтверждённые отзывы появятся после подключения модерации"
          description="Вымышленные или демонстрационные отзывы не используются. Сводный рейтинг и количество отзывов появятся только после публикации реальных оценок."
        />
      </InfoSection>
    </InfoPageLayout>
  );
}
