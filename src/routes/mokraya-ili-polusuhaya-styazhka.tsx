import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";

const TITLE = "Мокрая или полусухая стяжка — что выбрать | Шадов и партнёры";
const DESCRIPTION =
  "Честное сравнение мокрой и полусухой стяжки: прочность, сроки, трещины, работа с тёплым полом и цена за м² в Москве. Делаем обе технологии — помогаем выбрать под ваш объект.";

const ROWS: Array<{ param: string; wet: string; semi: string }> = [
  { param: "Прочность на сжатие", wet: "М200–М300 при правильном уходе", semi: "М150–М200, зависит от уплотнения" },
  { param: "Риск рыхлого слоя", wet: "Минимальный: раствор жидкий и сам заполняет пустоты", semi: "Есть: при недоуплотнении внизу остаются пустоты, потом бухтение" },
  { param: "Работа с тёплым полом", wet: "Плотно облегает трубу, тепло отдаётся равномерно", semi: "Возможны воздушные карманы у трубы, пол греет пятнами" },
  { param: "Ходить можно", wet: "Через 3 суток", semi: "Через 12 часов" },
  { param: "Плитка", wet: "Через 14 суток", semi: "Через 7 суток" },
  { param: "Ламинат и паркет", wet: "Через 28 суток", semi: "Через 14–21 сутки" },
  { param: "Усадочные трещины", wet: "Есть риск без ухода, поэтому мы проливаем и укрываем 3 суток", semi: "Меньше воды — меньше усадка, но трещины бывают при плохом уплотнении" },
  { param: "Грязь на объекте", wet: "Больше: раствор жидкий", semi: "Меньше" },
  { param: "Цена работы за м²", wet: "550 ₽ (810 ₽ под ключ, слой до 50 мм)", semi: "450 ₽ (690 ₽ под ключ, слой до 60 мм)" },
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
      h1="Мокрая или полусухая стяжка: что выбрать"
      intro="Делаем обе технологии и не навязываем ни одну. Ниже — честное сравнение по прочности, срокам и цене, чтобы вы выбрали под свой объект и график."
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
          Главное в полусухой — уплотнение: без пневмонагнетателя и затирочной машины слой получается рыхлым. Мы
          укладываем её механизированно, добавляем фиброволокно и на приёмке простукиваем всю площадь при вас.
        </p>
      </InfoSection>

      <InfoSection title="Когда лучше мокрая">
        <p>
          Если сроки позволяют выждать 28 суток, мокрая даёт максимальный запас прочности и полностью исключает риск
          недоуплотнения. Марка раствора известна, уход прописан, отклонения видны сразу.
        </p>
        <p>
          Отдельно про тёплый пол: жидкий раствор плотно обжимает трубу без воздушных карманов. В связке «тёплый пол +
          стяжка» мы чаще рекомендуем мокрую, а полусухую делаем слоем от 60 мм над трубой с армированием.
        </p>
        <p>Гарантия 3 года действует на обе технологии.</p>
      </InfoSection>

      <InfoSection title="Что делать дальше">
        <p>
          Посмотрите полный прайс на обе технологии — там расписаны базовая цена, все надбавки и готовые примеры с
          итоговой суммой. На замере скажем, какая стяжка выгоднее именно у вас.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/styazhka-pola"
            className="inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Прайс на мокрую стяжку
          </Link>
          <Link
            to="/polusuhaya-styazhka"
            className="inline-flex rounded-lg border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary"
          >
            Прайс на полусухую стяжку
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