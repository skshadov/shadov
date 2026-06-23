import { createFileRoute } from "@tanstack/react-router";
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
        <p>Данные используются для подготовки предварительного расчёта стоимости работ, связи с пользователем по выбранному способу, согласования встречи или выезда на объект и последующего оформления договора.</p>
      </InfoSection>

      <InfoSection title="3. Перечень действий с данными">
        <p>Сбор, запись, систематизация, накопление, хранение, уточнение, использование, передача (предоставление, доступ) уполномоченным сотрудникам оператора, блокирование, удаление и уничтожение — как с использованием средств автоматизации, так и без них.</p>
      </InfoSection>

      <InfoSection title="4. Добровольность и срок согласия">
        <p>Согласие даётся свободно, своей волей и в своём интересе. Пользователь подтверждает его установкой обязательного чекбокса перед отправкой формы. Срок действия согласия — до его отзыва, но не более 3 лет с момента последнего обращения.</p>
      </InfoSection>

      <InfoSection title="5. Отзыв согласия">
        <p>Согласие может быть отозвано в любое время путём направления письменного обращения на адрес электронной почты или почтовый адрес оператора. После получения отзыва оператор прекращает обработку данных и уничтожает их в течение 30 дней, кроме случаев, предусмотренных законом.</p>
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
            title="Сведения об операторе публикуются на странице реквизитов"
            description="Полные сведения об операторе — наименование, ИНН, адрес и контакты — размещаются на странице «Реквизиты»."
          />
        )}
      </InfoSection>
    </InfoPageLayout>
  );
}
