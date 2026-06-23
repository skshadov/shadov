import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, InfoList, buildInfoHead } from "@/components/info/InfoPageLayout";
import { PlaceholderNotice } from "@/components/common/PlaceholderNotice";
import { regions, company } from "@/config/company";

const PATH = "/about";
const TITLE = "О компании — Шадов и партнёры";
const DESC = "Шадов и партнёры — генеральный подрядчик в Москве и Московской области. Строительство, ремонт и инженерные системы по прямому договору с поэтапной оплатой.";

export const Route = createFileRoute("/about")({
  head: () => buildInfoHead({
    title: TITLE,
    description: DESC,
    path: PATH,
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "О компании", path: PATH },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "О компании" }]}
      h1="О компании Шадов и партнёры"
      intro={
        <p>
          {company.brandFull}. Работаем в {regions.slice(0, 2).join(" и ")}.
          Выполняем строительство, ремонт и инженерные системы по прямому
          договору с заказчиком.
        </p>
      }
    >
      <InfoSection title="Направления работ">
        <InfoList
          items={[
            "Строительство частных и многоквартирных домов под ключ",
            "Ремонт квартир, домов и коммерческих помещений",
            "Инженерные системы: электромонтаж, сантехника, отопление, тёплый пол",
            "Генеральный подряд с единым центром ответственности",
          ]}
        />
        <p>
          Подробное содержание каждого направления — на страницах{" "}
          <Link to="/stroitelstvo" className="text-primary underline decoration-2 font-semibold">строительства</Link>
          {", "}
          <Link to="/remont" className="text-primary underline decoration-2 font-semibold">ремонта</Link> и{" "}
          <Link to="/inzhenernye-sistemy" className="text-primary underline decoration-2 font-semibold">инженерных систем</Link>.
        </p>
      </InfoSection>

      <InfoSection title="Как мы работаем">
        <InfoList
          items={[
            "Прямой договор с заказчиком без посреднической цепочки",
            "Поэтапная оплата: аванс перечисляется только на текущий этап",
            "Следующий этап оплачивается после приёмки предыдущего",
            "Ежедневная отчётность по объекту и контроль скрытых работ по актам",
            "Финальная приёмка с актами и исполнительной документацией",
          ]}
        />
        <p>
          Подробнее — в разделе{" "}
          <Link to="/how-we-work" className="text-primary underline decoration-2 font-semibold">«Как мы работаем»</Link>{" "}и{" "}
          <Link to="/kontrol-kachestva" className="text-primary underline decoration-2 font-semibold">«Контроль качества»</Link>.
        </p>
      </InfoSection>

      <InfoSection title="География работ">
        <InfoList items={regions} />
      </InfoSection>

      <InfoSection title="Команда">
        <PlaceholderNotice
          title="Состав команды публикуется после подтверждения данных"
          description="Состав команды публикуется через административную панель после подтверждения данных и согласия на размещение. До этого момента публичные карточки сотрудников не отображаются."
        />
      </InfoSection>
    </InfoPageLayout>
  );
}
