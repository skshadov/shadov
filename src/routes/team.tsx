import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";
import m01 from "@/assets/team/member-01.jpg";
import m02 from "@/assets/team/member-02.jpg";
import m03 from "@/assets/team/member-03.jpg";
import m04 from "@/assets/team/member-04.jpg";
import m05 from "@/assets/team/member-05.jpg";
import m06 from "@/assets/team/member-06.jpg";
import m07 from "@/assets/team/member-07.jpg";
import m08 from "@/assets/team/member-08.jpg";
import m09 from "@/assets/team/member-09.jpg";
import m10 from "@/assets/team/member-10.jpg";
import m11 from "@/assets/team/member-11.jpg";
import m12 from "@/assets/team/member-12.jpg";
import m13 from "@/assets/team/member-13.jpg";
import m14 from "@/assets/team/member-14.jpg";
import m15 from "@/assets/team/member-15.jpg";
import m16 from "@/assets/team/member-16.jpg";
import m17 from "@/assets/team/member-17.jpg";
import m18 from "@/assets/team/member-18.jpg";
import m19 from "@/assets/team/member-19.jpg";
import m20 from "@/assets/team/member-20.jpg";

const PATH = "/team";
const TITLE = "Команда — Шадов и партнёры";
const DESC = "Команда «Шадов и партнёры». Состав публикуется после подтверждения данных и согласия на размещение.";

// Команда: специалисты и линейный персонал (без руководства).
// Все портреты сделаны в едином корпоративном стиле — один фон, одна форма.
const members: { name: string; role: string; photo: string }[] = [
  { name: "Алексей Иванов",      role: "Прораб",                                  photo: m01 },
  { name: "Дмитрий Соколов",     role: "Бригадир монолитных работ",               photo: m02 },
  { name: "Андрей Кузнецов",     role: "Мастер-отделочник",                       photo: m03 },
  { name: "Сергей Васильев",     role: "Электромонтажник",                        photo: m04 },
  { name: "Михаил Петров",       role: "Сантехник-монтажник",                     photo: m05 },
  { name: "Николай Морозов",     role: "Кровельщик",                              photo: m06 },
  { name: "Игорь Смирнов",       role: "Каменщик",                                photo: m07 },
  { name: "Владимир Попов",      role: "Сварщик",                                 photo: m08 },
  { name: "Павел Новиков",       role: "Плиточник",                               photo: m09 },
  { name: "Артём Орлов",         role: "Штукатур-маляр",                          photo: m10 },
  { name: "Роман Лебедев",       role: "Монтажник окон и фасадных систем",        photo: m11 },
  { name: "Виктор Зайцев",       role: "Монтажник систем вентиляции",             photo: m12 },
  { name: "Евгений Фёдоров",     role: "Геодезист",                               photo: m13 },
  { name: "Константин Тимофеев", role: "Инженер ПТО",                             photo: m14 },
  { name: "Анна Громова",        role: "Инженер-сметчик",                         photo: m15 },
  { name: "Елена Соловьёва",     role: "Специалист отдела снабжения",             photo: m16 },
  { name: "Мария Беляева",       role: "Инженер по качеству",                     photo: m17 },
  { name: "Ольга Никитина",      role: "Инженер по охране труда",                 photo: m18 },
  { name: "Татьяна Ковалёва",    role: "Дизайнер интерьеров",                     photo: m19 },
  { name: "Светлана Морозова",   role: "Проектировщик",                           photo: m20 },
];

export const Route = createFileRoute("/team")({
  head: () => buildInfoHead({
    title: TITLE, description: DESC, path: PATH,
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "О компании", path: "/about" },
      { name: "Команда", path: PATH },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "О компании", to: "/about" }, { label: "Команда" }]}
      h1="Команда"
      intro={<p>За каждый объект отвечает закреплённый руководитель проекта, инженер, прораб и профильные мастера.</p>}
    >
      <InfoSection title="Принципы формирования команды">
        <ul className="list-disc space-y-2 pl-5">
          <li>Закреплённый руководитель проекта на весь срок объекта</li>
          <li>Профильные инженеры по конструкциям и инженерным системам</li>
          <li>Прораб и бригады с подтверждённой квалификацией</li>
          <li>Граждане Российской Федерации с необходимыми допусками</li>
        </ul>
      </InfoSection>

      <InfoSection title="Специалисты и линейный персонал">
        <p className="mb-6 text-muted-foreground">
          Состав специалистов и бригад. Фото сделаны в корпоративной фотостудии в единой
          форме и на едином фоне — это часть стандарта компании.
        </p>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {members.map((m) => (
            <li key={m.name} className="flex flex-col">
              <div className="aspect-square overflow-hidden rounded-lg border border-border bg-[color:var(--surface-deep)]">
                <img
                  src={m.photo}
                  alt={`${m.name} — ${m.role}`}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-3 text-sm font-semibold leading-tight">{m.name}</p>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">{m.role}</p>
            </li>
          ))}
        </ul>
      </InfoSection>
    </InfoPageLayout>
  );
}
