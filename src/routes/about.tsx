import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, InfoList, buildInfoHead } from "@/components/info/InfoPageLayout";
import { regions, company } from "@/config/company";

const PATH = "/about";
const TITLE = "О компании — Шадов и партнёры";
const DESC = "Шадов и партнёры — черновой цикл в Москве и области: механизированная штукатурка, мокрая стяжка пола, тёплый пол, черновая электрика и сантехника по прямому договору.";

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
            За <strong>20 лет</strong> мы прошли путь от небольшой бригады отделочников
            до узкопрофильной компании, которая делает только черновой цикл — и делает его
            так, чтобы следующий подрядчик по чистовой отделке ничего не переделывал.
          </p>
          <p className="mt-4">
            Работаем в {regions.slice(0, 2).join(" и ")} по прямому договору с
            заказчиком, без посреднических цепочек и скрытых наценок:
            механизированная штукатурка, мокрая стяжка пола, тёплый пол,
            черновая разводка электрики и сантехники.
          </p>
        </>
      }
    >
      <InfoSection title="Цифры, за которыми — реальные объекты">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { v: "20", l: "лет на рынке с 2005 года" },
            { v: "500+", l: "сданных объектов в Москве и области" },
            { v: "180 000+", l: "м² штукатурки и стяжки" },
            { v: "3 года", l: "гарантии на выполненные работы" },
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
          Цифры — это не маркетинг, а сумма наших объектов: квартиры в новостройках
          Москвы, загородные дома в Подмосковье и коммерческие помещения. Большая
          часть новых заказов приходит от дизайнеров и по рекомендациям —
          для нас это лучшая оценка работы.
        </p>
      </InfoSection>

      <InfoSection title="Почему с нами хочется работать">
        <InfoList
          items={[
            "Узкая специализация. Мы делаем пять работ чернового цикла и знаем их технологию до мелочей.",
            "Прозрачная смета. В прайсе указана только стоимость работ — материалы заказчик покупает сам, без наценки и без «уточним по ходу».",
            "Поэтапная оплата. Платите за фактически принятый этап, а не за обещания.",
            "Свои бригады и штукатурные станции. Работы выполняют штатные мастера, а не случайные подрядчики со стройрынка.",
            "Контроль скрытых работ по актам и фотофиксации: трассы, армирование, опрессовка — всё зафиксировано до закрытия.",
            "Гарантия в договоре — 3 года на выполненные работы.",
          ]}
        />
      </InfoSection>

      <InfoSection title="Наш подход">
        <p>
          Мы делаем так, как делали бы для себя. Это значит — заводские смеси
          вместо «подешевле», профессиональные штукатурные станции и
          измерительный инструмент, контроль геометрии по правилу и честный
          разговор с заказчиком, если что-то идёт не по плану. Мы не обещаем
          «дёшево и за три дня» — мы обещаем ровные стены и пол, готовые
          под чистовую отделку.
        </p>
        <p className="mt-3">
          Стяжку делаем в двух технологиях: классическую мокрую —
          когда есть время на набор прочности, и полусухую с фиброй —
          когда ремонт идёт в жёстком графике. Технологию подбираем
          под сроки и объект, а не под удобство бригады.
        </p>
      </InfoSection>

      <InfoSection title="Направления работ">
        <InfoList
          items={[
            "Механизированная штукатурка стен и потолков под покраску и обои",
            "Мокрая цементно-песчаная и полусухая стяжка пола",
            "Водяной и электрический тёплый пол",
            "Черновая разводка электрики: штробы, кабель, подрозетники, щит",
            "Черновая разводка сантехники: вода, канализация, коллектор, опрессовка",
          ]}
        />
        <p>
          Подробное содержание и цены — на страницах{" "}
          <Link to="/mekhanizirovannaya-shtukaturka" className="text-primary underline decoration-2 font-semibold">штукатурки</Link>
          {", "}
          <Link to="/styazhka-pola" className="text-primary underline decoration-2 font-semibold">стяжки пола</Link> и в общем{" "}
          <Link to="/prices" className="text-primary underline decoration-2 font-semibold">прайсе</Link>.
        </p>
      </InfoSection>

      <InfoSection title="Как мы работаем">
        <InfoList
          items={[
            "Прямой договор с заказчиком без посреднической цепочки",
            "Поэтапная оплата: аванс перечисляется только на текущий этап",
            "Следующий этап оплачивается после приёмки предыдущего",
            "Отчётность по объекту и контроль скрытых работ по актам",
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
