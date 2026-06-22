import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, InfoList, buildInfoHead } from "@/components/info/InfoPageLayout";

const PATH = "/how-we-work";
const TITLE = "Как мы работаем — Шадов и партнёры";
const DESC = "Прямой договор, поэтапная оплата, ежедневная отчётность, контроль скрытых работ по актам и поэтапная приёмка объекта.";

export const Route = createFileRoute("/how-we-work")({
  head: () => buildInfoHead({
    title: TITLE, description: DESC, path: PATH,
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "Как мы работаем", path: PATH },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Как мы работаем" }]}
      h1="Как мы работаем"
      intro={<p>Стандартный порядок работы с заказчиком — от запроса до сдачи объекта.</p>}
    >
      <InfoSection title="Этапы взаимодействия">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Обращение заказчика и предварительная оценка задачи</li>
          <li>Выезд и обследование объекта или изучение проекта</li>
          <li>Подготовка подробной сметы и план-графика этапов</li>
          <li>Подписание прямого договора с заказчиком</li>
          <li>Аванс этапа — только на текущий этап работ</li>
          <li>Выполнение работ с ежедневной отчётностью и фотофиксацией</li>
          <li>Поэтапная приёмка с актами скрытых работ</li>
          <li>Оплата следующего этапа после приёмки предыдущего</li>
          <li>Сдача объекта с исполнительной документацией</li>
        </ol>
      </InfoSection>
      <InfoSection title="Принципы">
        <InfoList
          items={[
            "Прямой договор с заказчиком без посредников",
            "Поэтапная оплата и поэтапная приёмка",
            "Контроль скрытых работ по актам до закрытия конструкций",
            "Ежедневная отчётность по объекту",
            "Документация по составу договора передаётся при сдаче",
          ]}
        />
      </InfoSection>
    </InfoPageLayout>
  );
}
