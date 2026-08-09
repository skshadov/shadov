import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";

const TITLE = "Мокрая или полусухая стяжка — что надёжнее | Шадов и партнёры";
const DESCRIPTION =
  "Честное сравнение мокрой и полусухой стяжки: прочность, сроки, трещины, работа с тёплым полом и цена за м² в Москве. Объясняем, почему мы делаем только мокрую.";

const ROWS: Array<{ param: string; wet: string; semi: string }> = [
  { param: "Прочность на сжатие", wet: "М200–М300 при правильном уходе", semi: "М150–М200, зависит от уплотнения" },
  { param: "Риск рыхлого слоя", wet: "Минимальный: раствор жидкий и сам заполняет пустоты", semi: "Есть: при недоуплотнении внизу остаются пустоты, потом бухтение" },
  { param: "Работа с тёплым полом", wet: "Плотно облегает трубу, тепло отдаётся равномерно", semi: "Возможны воздушные карманы у трубы, пол греет пятнами" },
  { param: "Ходить можно", wet: "Через 3 суток", semi: "Через 12 часов" },
  { param: "Плитка", wet: "Через 14 суток", semi: "Через 7 суток" },
  { param: "Ламинат и паркет", wet: "Через 28 суток", semi: "Через 14–21 сутки" },
  { param: "Усадочные трещины", wet: "Есть риск без ухода, поэтому мы проливаем и укрываем 3 суток", semi: "Меньше воды — меньше усадка, но трещины бывают при плохом уплотнении" },
  { param: "Грязь на объекте", wet: "Больше: раствор жидкий", semi: "Меньше" },
  { param: "Цена работы за м²", wet: "550 ₽ (810 ₽ под ключ, слой до 50 мм)", semi: "500–650 ₽ по рынку Москвы" },
];

export const Route = createFileRoute("/mokraya-ili-polusuhaya-styazhka")({
  head: () =>
    buildInfoHead({
      title: TITLE,
      description: DESCRIPTION,
      path: "/mokraya-ili-polusuhaya-styazhka",
      breadcrumbs: [
        { name: "Главная", path: "/" },
        { name: "Мокрая стяжка", path: "/styazhka-pola" },
        { name: "Мокрая или полусухая", path: "/mokraya-ili-polusuhaya-styazhka" },
      ],
    }),
  component: ComparisonPage,
});

function ComparisonPage() {
  return (
    <InfoPageLayout
      breadcrumbs={[
        { label: "Главная", to: "/" },
        { label: "Мокрая стяжка", to: "/styazhka-pola" },
        { label: "Мокрая или полусухая" },
      ]}
      h1="Мокрая или полусухая стяжка: что надёжнее"
      intro="Полусухую стяжку ищут в двадцать раз чаще — она быстрее сохнет и меньше пачкает объект. Мы делаем только мокрую и объясняем почему, без маркетинга и без запугивания."
    >
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-6 py-3 font-medium">Параметр</th>
                <th scope="col" className="px-6 py-3 font-medium">Мокрая</th>
                <th scope="col" className="px-6 py-3 font-medium">Полусухая</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ROWS.map((r) => (
                <tr key={r.param}>
                  <td className="px-6 py-4 align-top font-medium text-foreground">{r.param}</td>
                  <td className="px-6 py-4 align-top text-foreground/90">{r.wet}</td>
                  <td className="px-6 py-4 align-top text-muted-foreground">{r.semi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-border md:hidden">
          {ROWS.map((r) => (
            <li key={r.param} className="px-5 py-4">
              <div className="font-medium text-foreground">{r.param}</div>
              <div className="mt-2 text-sm text-foreground/90">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Мокрая: </span>
                {r.wet}
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">
                <span className="text-xs uppercase tracking-wider">Полусухая: </span>
                {r.semi}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <InfoSection title="Когда полусухая действительно уместна">
        <p>
          Если ремонт идёт в жёстком графике и покрытие надо класть через две недели, полусухая выигрывает по срокам.
          На больших сухих площадях без тёплого пола и с хорошей бригадой, у которой есть пневмонагнетатель и
          затирочная машина, она даёт нормальный результат.
        </p>
        <p>
          Проблема не в технологии, а в допуске: качество полусухой стяжки целиком зависит от степени уплотнения, и
          проверить его после затирки на глаз нельзя. Мокрая стяжка прощает больше и проверяется простукиванием.
        </p>
      </InfoSection>

      <InfoSection title="Почему мы выбрали мокрую">
        <p>
          Мы даём 3 года гарантии и выезжаем на устранение за свой счёт. При мокрой технологии мы контролируем
          результат: марка раствора известна, уход за стяжкой прописан, отклонения видны сразу. Это дешевле для нас и
          безопаснее для вас, чем гадать, качественно ли уплотнён полусухой слой под ногами.
        </p>
        <p>
          Отдельно про тёплый пол: жидкий раствор плотно обжимает трубу без воздушных карманов. Именно поэтому в
          связке «тёплый пол + стяжка» мы работаем только мокрым способом.
        </p>
      </InfoSection>

      <InfoSection title="Что делать дальше">
        <p>
          Посмотрите полный прайс на мокрую стяжку — там расписаны базовая цена, все надбавки и три готовых примера с
          итоговой суммой. Если вам всё же нужна полусухая, скажем честно и порекомендуем, на что смотреть при выборе
          подрядчика.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/styazhka-pola"
            className="inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Прайс на мокрую стяжку
          </Link>
          <Link
            to="/teplyy-pol"
            className="inline-flex rounded-lg border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary"
          >
            Тёплый пол со стяжкой
          </Link>
        </div>
      </InfoSection>
    </InfoPageLayout>
  );
}