import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";
import { PlaceholderNotice } from "@/components/common/PlaceholderNotice";
import { company, isFilled } from "@/config/company";

const PATH = "/personal-data-consent";
const TITLE = "Согласие на обработку персональных данных — Шадов и партнёры";
const DESC = "Текст согласия на обработку персональных данных, передаваемых через форму предварительного расчёта.";

export const Route = createFileRoute("/personal-data-consent")({
  head: () => buildInfoHead({
    title: TITLE, description: DESC, path: PATH,
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "Согласие на обработку персональных данных", path: PATH },
    ],
  }),
  component: Page,
});

function Page() {
  const hasOperator = isFilled(company.legalName) || isFilled(company.inn);
  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Согласие на обработку персональных данных" }]}
      h1="Согласие на обработку персональных данных"
    >
      <InfoSection>
        <PlaceholderNotice
          title="Демонстрационный локальный режим"
          description="На текущем этапе форма не отправляет данные на сервер. До подключения защищённой обработки заявок согласие распространяется только на локальное использование данных в браузере пользователя."
        />
      </InfoSection>

      <InfoSection title="1. Состав передаваемых данных">
        <p>В форме предварительного расчёта пользователь может указать только следующие поля:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Имя</li>
          <li>Телефон</li>
          <li>Email — по желанию</li>
          <li>Тип объекта</li>
          <li>Услуга и параметры (площадь или объём, единица)</li>
          <li>Состояние объекта, расположение и сроки — по желанию</li>
          <li>Комментарий и предпочитаемый способ связи</li>
        </ul>
        <p>Иных полей форма не содержит.</p>
      </InfoSection>

      <InfoSection title="2. Цели обработки">
        <p>После подключения защищённой обработки заявок данные предполагается использовать для подготовки предварительного расчёта и связи по выбранному способу. На текущем этапе данные используются только локально в браузере пользователя.</p>
      </InfoSection>

      <InfoSection title="3. Добровольность и срок согласия">
        <p>Согласие является добровольным. Пользователь подтверждает его установкой чекбокса перед отправкой формы. Согласие действует до его отзыва.</p>
      </InfoSection>

      <InfoSection title="4. Отзыв согласия">
        <p>Пользователь может в любой момент очистить локально сохранённые данные кнопкой в форме либо средствами браузера. После подключения защищённой базы данных порядок отзыва согласия будет уточнён и опубликован дополнительно.</p>
      </InfoSection>

      <InfoSection title="5. Текущий режим обработки">
        <p>До подключения защищённой обработки заявок форма работает в локальном демонстрационном режиме: данные сохраняются только в браузере пользователя и не передаются менеджеру. Подробнее — в <Link to="/privacy" className="text-primary underline underline-offset-2 hover:opacity-80">политике конфиденциальности</Link>.</p>
      </InfoSection>

      <InfoSection title="6. Сведения об операторе">
        {hasOperator ? (
          <ul className="space-y-2">
            {isFilled(company.legalName) ? <li>Оператор: {company.legalName}</li> : null}
            {isFilled(company.inn) ? <li>ИНН: {company.inn}</li> : null}
            {isFilled(company.officeAddress) ? <li>Адрес: {company.officeAddress}</li> : null}
          </ul>
        ) : (
          <PlaceholderNotice
            title="Сведения об операторе будут опубликованы после заполнения реквизитов"
            description="Сведения об операторе будут опубликованы после заполнения и проверки реквизитов компании. До подключения защищённой базы форма работает в демонстрационном локальном режиме."
          />
        )}
      </InfoSection>
    </InfoPageLayout>
  );
}
