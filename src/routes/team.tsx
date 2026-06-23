import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";

const PATH = "/team";
const TITLE = "Команда — Шадов и партнёры";
const DESC = "Команда «Шадов и партнёры». Состав публикуется после подтверждения данных и согласия на размещение.";

export const Route = createFileRoute("/team")({
  head: () => buildInfoHead({
    title: TITLE, description: DESC, path: PATH,
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "О компании", path: "/about" },
      { name: "Команда", path: PATH },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "О компании", to: "/about" }, { label: "Команда" }]}
      h1="Команда"
      intro={<p>За каждый объект отвечает закреплённый руководитель проекта, инженер, прораб и профильные мастера.</p>}
    >
      <InfoSection title="Принципы формирования команды">
        <ul className="list-disc space-y-2 pl-5">
          <li>Закреплённый руководитель проекта на весь срок объекта</li>
          <li>Профильные инженеры по конструкциям и инженерным системам</li>
          <li>Прораб и бригады с подтверждённой квалификацией</li>
          <li>Граждане Российской Федерации с необходимыми допусками</li>
        </ul>
      </InfoSection>
    </InfoPageLayout>
  );
}
