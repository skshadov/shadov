import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";

const PATH = "/cookies";
const TITLE = "Политика использования cookies — Шадов и партнёры";
const DESC = "Сведения о Cookie, localStorage и sessionStorage сайта. На текущем этапе аналитические и рекламные Cookie не используются.";

export const Route = createFileRoute("/cookies")({
  head: () => buildInfoHead({
    title: TITLE, description: DESC, path: PATH,
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "Политика использования cookies", path: PATH },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Политика использования cookies" }]}
      h1="Политика использования cookies"
    >
      <InfoSection title="Общее">
        <p>Сайт использует только строго необходимые cookie и локальное хранилище браузера для работы аутентификации, личного кабинета и сохранения черновиков форм. Аналитические и рекламные cookie не устанавливаются без отдельного согласия пользователя.</p>
      </InfoSection>

      <InfoSection title="Cookie">
        <p>Технические cookie устанавливаются для поддержания сессии пользователя, защиты от подделки запросов и работы личного кабинета. Cookie сторонних рекламных и аналитических систем не используются.</p>
      </InfoSection>

      <InfoSection title="localStorage">
        <ul className="list-disc space-y-2 pl-5">
          <li><code className="rounded bg-muted px-1.5 py-0.5">shadov:estimate-draft</code> — черновик формы предварительного расчёта. Хранится только на устройстве пользователя, согласие на обработку сбрасывается при загрузке.</li>
          <li><code className="rounded bg-muted px-1.5 py-0.5">shadov-cost-calculator-v1</code> — выбранный режим калькулятора, набор позиций и введённые объёмы. Личные данные не сохраняются.</li>
          <li>Ключи сервиса аутентификации — хранят токен сессии пользователя личного кабинета; удаляются при выходе из аккаунта.</li>
        </ul>
      </InfoSection>

      <InfoSection title="sessionStorage">
        <p>sessionStorage сайтом не используется.</p>
      </InfoSection>

      <InfoSection title="Удаление локально сохранённых данных">
        <p>Данные удаляются кнопкой «Очистить сохранённые данные» в форме расчёта, ручным удалением соответствующих ключей localStorage или очисткой данных сайта в настройках браузера.</p>
        <p>Подробнее — в <Link to="/privacy" className="text-primary underline underline-offset-2 hover:opacity-80">политике конфиденциальности</Link>.</p>
      </InfoSection>
    </InfoPageLayout>
  );
}
