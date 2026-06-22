import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, InfoList, buildInfoHead } from "@/components/info/InfoPageLayout";

const PATH = "/kontrol-kachestva";
const TITLE = "Контроль качества — Шадов и партнёры";
const DESC = "Поэтапная приёмка по актам, фотофиксация скрытых работ, инструментальный контроль геометрии, опрессовка инженерных систем.";

export const Route = createFileRoute("/kontrol-kachestva")({
  head: () => buildInfoHead({
    title: TITLE, description: DESC, path: PATH,
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "Контроль качества", path: PATH },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Контроль качества" }]}
      h1="Контроль качества"
      intro={<p>На каждом этапе фиксируется контрольный лист и оформляются акты скрытых работ.</p>}
    >
      <InfoSection title="Инструменты контроля">
        <InfoList items={[
          "Поэтапная приёмка работ с актами",
          "Фотофиксация скрытых работ до закрытия конструкций",
          "Инструментальный контроль геометрии и уровней",
          "Опрессовка и пусконаладка инженерных систем",
          "Финальная приёмка с участием заказчика",
        ]} />
      </InfoSection>
      <InfoSection title="Документы по приёмке">
        <InfoList items={[
          "Акты выполненных работ по этапам",
          "Акты скрытых работ с фотофиксацией",
          "Исполнительная документация по инженерным системам",
          "Сопроводительные документы по применённым материалам и оборудованию",
        ]} />
      </InfoSection>
    </InfoPageLayout>
  );
}
