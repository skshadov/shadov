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
        <>
          <p>
            {company.brandFull} — на строительном рынке с <strong>2005 года</strong>.
            За <strong>20 лет</strong> мы прошли путь от небольшой бригады отделочников до
            полноценного генерального подрядчика и стали для сотен семей теми,
            кому доверяют самое важное — дом, в котором будут жить дети и внуки.
          </p>
          <p className="mt-4">
            Работаем в {regions.slice(0, 2).join(" и ")} по прямому договору с
            заказчиком, без посреднических цепочек и скрытых наценок.
            Строим дома под ключ, делаем ремонты «под чистовую» и собираем
            инженерные системы — от фундамента до тёплого пола под мрамором.
          </p>
        </>
      }
    >
      <InfoSection title="Цифры, за которыми — реальные объекты">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { v: "20", l: "лет на рынке с 2005 года" },
            { v: "500+", l: "сданных объектов в Москве и области" },
            { v: "180 000+", l: "м² построено и отремонтировано" },
            { v: "5 лет", l: "гарантии на конструктив и инженерию" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="font-display text-3xl font-semibold text-primary">
                {s.v}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Цифры — это не маркетинг, а сумма наших объектов: частные дома
          в Подмосковье, квартиры в новостройках Москвы, коммерческие
          помещения и реконструкции. Большая часть новых заказов приходит
          по рекомендациям — для нас это лучшая оценка работы.
        </p>
      </InfoSection>

      <InfoSection title="Почему с нами хочется работать">
        <InfoList
          items={[
            "Один договор — одна ответственность. Не нужно сводить десять подрядчиков: за сроки, качество и бюджет отвечаем мы.",
            "Прозрачная смета. Все позиции — по утверждённому прайсу, без «уточним по ходу» и сюрпризов в конце.",
            "Поэтапная оплата. Платите за фактически принятый этап, а не за обещания.",
            "Свои бригады и прорабы. Ключевые работы выполняют штатные специалисты, а не случайные подрядчики со стройрынка.",
            "Контроль скрытых работ по актам и фотофиксации. Заказчик видит, что спрятано под отделкой.",
            "Гарантия в договоре. До 5 лет на конструктив и инженерные системы, обслуживание после сдачи.",
          ]}
        />
      </InfoSection>

      <InfoSection title="Наш подход">
        <p>
          Мы строим так, как строили бы для себя. Это значит — нормальные
          материалы вместо «подешевле», профессиональный инструмент,
          технадзор на площадке и честный разговор с заказчиком, если
          что-то идёт не по плану. Мы не обещаем «дёшево и за неделю» —
          мы обещаем сделать качественно, в срок и по согласованной смете.
        </p>
        <p className="mt-3">
          За эти годы через нас прошли объекты любой сложности: от
          студии в новостройке до загородных домов с панорамным остеклением
          и собственной инженерной инфраструктурой. И в каждом из них мы
          оставляем не просто стены и трубы, а ощущение, что всё сделано
          по-человечески.
        </p>
      </InfoSection>

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

      <InfoSection title="Готовы обсудить ваш объект?">
        <p>
          Расскажите о задаче — посчитаем предварительную стоимость,
          предложим решение и согласуем удобный график работ. Консультация
          и выезд на объект — бесплатно.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/kalkulyator-stoimosti"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Рассчитать стоимость
          </Link>
          <Link
            to="/contacts"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-5 text-sm font-semibold hover:border-primary/60"
          >
            Связаться с нами
          </Link>
        </div>
      </InfoSection>
    </InfoPageLayout>
  );
}
