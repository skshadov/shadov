import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";

const PATH = "/terms";
const TITLE = "Пользовательское соглашение — Шадов и партнёры";
const DESC = "Условия использования сайта. Информация на сайте носит справочный характер, цены ориентировочные, расчёт калькулятора — предварительный.";

export const Route = createFileRoute("/terms")({
  head: () => buildInfoHead({
    title: TITLE, description: DESC, path: PATH,
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "Пользовательское соглашение", path: PATH },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Пользовательское соглашение" }]}
      h1="Пользовательское соглашение"
    >
      <InfoSection title="1. Назначение сайта">
        <p>Сайт носит информационный характер. Содержание сайта описывает направления работ компании и порядок взаимодействия с заказчиком.</p>
      </InfoSection>

      <InfoSection title="2. Справочный характер информации">
        <ul className="list-disc space-y-2 pl-5">
          <li>Информация на сайте носит справочный характер.</li>
          <li>Цены являются ориентировочными.</li>
          <li>Калькулятор выполняет предварительный расчёт.</li>
          <li>Результат расчёта не является сметой.</li>
          <li>Результат расчёта не является коммерческим предложением.</li>
          <li>Результат расчёта не является публичной офертой.</li>
        </ul>
      </InfoSection>

      <InfoSection title="3. Окончательные условия">
        <p>Состав работ определяется проектом, согласованной сметой и договором. Материалы учитываются только при их прямом указании. Использование сайта не создаёт договорных обязательств. Окончательные условия фиксируются отдельным договором.</p>
      </InfoSection>

      <InfoSection title="4. Демонстрационный режим форм">
        <p>На текущем этапе формы сайта работают в локальном демонстрационном режиме и не передают данные в информационные системы компании. Подробнее — в <Link to="/privacy" className="text-primary underline underline-offset-2 hover:opacity-80">политике конфиденциальности</Link>.</p>
      </InfoSection>

      <InfoSection title="5. Изменение условий">
        <p>Условия могут изменяться по мере развития сайта. Актуальная редакция размещается на этой странице.</p>
      </InfoSection>
    </InfoPageLayout>
  );
}
