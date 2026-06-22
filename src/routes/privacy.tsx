import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";
import { PlaceholderNotice } from "@/components/common/PlaceholderNotice";
import { company, isFilled } from "@/config/company";

const PATH = "/privacy";
const TITLE = "Политика конфиденциальности — Шадов и партнёры";
const DESC = "Политика конфиденциальности сайта. Описывает фактическое локальное хранение данных в демонстрационном режиме и порядок их удаления.";

export const Route = createFileRoute("/privacy")({
  head: () => buildInfoHead({
    title: TITLE, description: DESC, path: PATH,
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "Политика конфиденциальности", path: PATH },
    ],
  }),
  component: Page,
});

function Page() {
  const hasOperator =
    isFilled(company.legalName) || isFilled(company.inn) || isFilled(company.officeAddress) || isFilled(company.email);
  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Политика конфиденциальности" }]}
      h1="Политика конфиденциальности"
    >
      <InfoSection>
        <PlaceholderNotice
          title="Демонстрационный режим"
          description="На текущем демонстрационном этапе формы не передают данные в информационные системы компании. Введённые данные могут сохраняться только на устройстве пользователя."
        />
      </InfoSection>

      <InfoSection title="1. Общие положения">
        <p>Настоящая политика описывает порядок обработки данных, которые пользователь может ввести на сайте {company.domain}, и фактическое поведение сайта на текущем этапе развития.</p>
      </InfoSection>

      <InfoSection title="2. Какие данные могут вводиться">
        <ul className="list-disc space-y-2 pl-5">
          <li>Имя, телефон, email — в форме предварительного расчёта</li>
          <li>Тип объекта, услуга, площадь или объём — для оценки задачи</li>
          <li>Состояние объекта, расположение, желаемые сроки — по желанию</li>
          <li>Комментарий и предпочитаемый способ связи</li>
          <li>Согласие на обработку персональных данных (обязательный чекбокс)</li>
        </ul>
      </InfoSection>

      <InfoSection title="3. Для чего данные предполагается использовать">
        <p>После подключения защищённой обработки заявок данные предполагается использовать для подготовки предварительного расчёта, согласования встречи и оформления договора. На текущем этапе данные используются только локально в браузере пользователя.</p>
      </InfoSection>

      <InfoSection title="4. Текущее локальное хранение">
        <ul className="list-disc space-y-2 pl-5">
          <li>Данные формы расчёта сохраняются в локальном хранилище браузера (localStorage) под ключом <code className="rounded bg-muted px-1.5 py-0.5">shadov:estimate-draft</code>.</li>
          <li>Настройки калькулятора сохраняются в localStorage под ключом <code className="rounded bg-muted px-1.5 py-0.5">shadov-cost-calculator-v1</code>. Личные данные в калькуляторе не запрашиваются.</li>
          <li>Файлы, выбранные в форме, никуда не отправляются и не сохраняются.</li>
          <li>Данные не передаются менеджеру и не покидают устройство пользователя.</li>
        </ul>
      </InfoSection>

      <InfoSection title="5. Cookie и localStorage">
        <p>На текущем этапе сайт не устанавливает аналитические и рекламные Cookie. Для работы демонстрационных инструментов используется локальное хранилище браузера. Подробнее — в <Link to="/cookies" className="text-primary underline-offset-2 hover:underline">политике использования cookies</Link>.</p>
      </InfoSection>

      <InfoSection title="6. Передача третьим лицам">
        <p>Данные не передаются третьим лицам. После подключения защищённой обработки заявок порядок передачи будет уточнён отдельным документом и согласием.</p>
      </InfoSection>

      <InfoSection title="7. Защита данных">
        <p>Локальное хранилище браузера доступно только в браузере пользователя на его устройстве. После подключения защищённой базы данных применяются меры разграничения доступа на стороне сервера.</p>
      </InfoSection>

      <InfoSection title="8. Права пользователя">
        <ul className="list-disc space-y-2 pl-5">
          <li>Не вводить данные в форму и не использовать калькулятор</li>
          <li>Очистить локально сохранённые данные в любой момент</li>
          <li>Отозвать согласие на обработку персональных данных</li>
        </ul>
      </InfoSection>

      <InfoSection title="9. Порядок удаления локальных данных">
        <p>Локально сохранённые данные удаляются кнопкой «Очистить сохранённые данные» в форме расчёта, очисткой локального хранилища браузера или удалением данных сайта в настройках браузера.</p>
      </InfoSection>

      <InfoSection title="10. Изменение документа">
        <p>Документ может быть изменён по мере подключения защищённой обработки заявок. Актуальная редакция размещается на этой странице.</p>
      </InfoSection>

      <InfoSection title="11. Контакты оператора">
        {hasOperator ? (
          <ul className="space-y-2">
            {isFilled(company.legalName) ? <li>Оператор: {company.legalName}</li> : null}
            {isFilled(company.inn) ? <li>ИНН: {company.inn}</li> : null}
            {isFilled(company.officeAddress) ? <li>Адрес: {company.officeAddress}</li> : null}
            {isFilled(company.email) ? <li>Email: <a href={`mailto:${company.email}`} className="text-primary underline-offset-2 hover:underline">{company.email}</a></li> : null}
          </ul>
        ) : (
          <PlaceholderNotice
            title="Сведения об операторе будут опубликованы после заполнения реквизитов"
            description="До подключения защищённой базы форма работает в демонстрационном локальном режиме. Сведения об операторе появятся одновременно с реквизитами."
          />
        )}
      </InfoSection>
    </InfoPageLayout>
  );
}
