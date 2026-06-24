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
import m21 from "@/assets/team/member-21.jpg";
import m22 from "@/assets/team/member-22.jpg";
import m23 from "@/assets/team/member-23.jpg";
import m24 from "@/assets/team/member-24.jpg";
import m25 from "@/assets/team/member-25.jpg";
import m26 from "@/assets/team/member-26.jpg";
import m27 from "@/assets/team/member-27.jpg";
import m28 from "@/assets/team/member-28.jpg";
import m29 from "@/assets/team/member-29.jpg";
import m30 from "@/assets/team/member-30.jpg";
import m31 from "@/assets/team/member-31.jpg";
import m32 from "@/assets/team/member-32.jpg";
import m33 from "@/assets/team/member-33.jpg";
import m34 from "@/assets/team/member-34.jpg";
import m35 from "@/assets/team/member-35.jpg";
import m36 from "@/assets/team/member-36.jpg";
import m37 from "@/assets/team/member-37.jpg";
import m38 from "@/assets/team/member-38.jpg";
import m39 from "@/assets/team/member-39.jpg";
import m40 from "@/assets/team/member-40.jpg";
import m41 from "@/assets/team/member-41.jpg";
import m42 from "@/assets/team/member-42.jpg";
import m43 from "@/assets/team/member-43.jpg";
import m44 from "@/assets/team/member-44.jpg";
import m45 from "@/assets/team/member-45.jpg";
import m46 from "@/assets/team/member-46.jpg";
import m47 from "@/assets/team/member-47.jpg";
import m48 from "@/assets/team/member-48.jpg";
import m49 from "@/assets/team/member-49.jpg";
import m50 from "@/assets/team/member-50.jpg";
import m51 from "@/assets/team/member-51.jpg";
import m52 from "@/assets/team/member-52.jpg";
import m53 from "@/assets/team/member-53.jpg";
import m54 from "@/assets/team/member-54.jpg";
import m55 from "@/assets/team/member-55.jpg";
import m56 from "@/assets/team/member-56.jpg";
import m57 from "@/assets/team/member-57.jpg";
import m58 from "@/assets/team/member-58.jpg";
import m59 from "@/assets/team/member-59.jpg";
import m60 from "@/assets/team/member-60.jpg";
import m61 from "@/assets/team/member-61.jpg";
import m62 from "@/assets/team/member-62.jpg";
import m63 from "@/assets/team/member-63.jpg";
import m64 from "@/assets/team/member-64.jpg";
import m65 from "@/assets/team/member-65.jpg";
import m66 from "@/assets/team/member-66.jpg";
import m67 from "@/assets/team/member-67.jpg";
import m68 from "@/assets/team/member-68.jpg";
import m69 from "@/assets/team/member-69.jpg";
import m70 from "@/assets/team/member-70.jpg";
import m71 from "@/assets/team/member-71.jpg";
import m72 from "@/assets/team/member-72.jpg";
import m73 from "@/assets/team/member-73.jpg";
import m74 from "@/assets/team/member-74.jpg";
import m75 from "@/assets/team/member-75.jpg";
import m76 from "@/assets/team/member-76.jpg";
import m77 from "@/assets/team/member-77.jpg";
import m78 from "@/assets/team/member-78.jpg";
import m79 from "@/assets/team/member-79.jpg";
import m80 from "@/assets/team/member-80.jpg";

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
  { name: "Денис Сорокин",       role: "Бригадир общестроительных работ",         photo: m21 },
  { name: "Юрий Кулагин",        role: "Плотник",                                 photo: m22 },
  { name: "Геннадий Антонов",    role: "Сварщик аргонщик",                        photo: m23 },
  { name: "Ирина Лазарева",      role: "Инженер ПТО",                             photo: m24 },
  { name: "Олег Тарасов",        role: "Электромонтажник слаботочных систем",     photo: m25 },
  { name: "Кирилл Жуков",        role: "Плиточник-облицовщик",                    photo: m26 },
  { name: "Степан Гончаров",     role: "Штукатур",                                photo: m27 },
  { name: "Тимур Белов",         role: "Кровельщик мягких кровель",               photo: m28 },
  { name: "Анатолий Карпов",     role: "Каменщик-бригадир",                       photo: m29 },
  { name: "Максим Шевченко",     role: "Монтажник систем вентиляции",             photo: m30 },
  { name: "Юлия Дроздова",       role: "Дизайнер интерьеров",                     photo: m31 },
  { name: "Виталий Кравцов",     role: "Старший прораб",                          photo: m32 },
  { name: "Дарья Семёнова",      role: "Геодезист",                               photo: m33 },
  { name: "Леонид Воронин",      role: "Машинист башенного крана",                photo: m34 },
  { name: "Антон Михайлов",      role: "Бетонщик",                                photo: m35 },
  { name: "Иван Гусев",          role: "Сантехник-монтажник",                     photo: m36 },
  { name: "Лариса Дмитриева",    role: "Специалист отдела снабжения",             photo: m37 },
  { name: "Алексей Поляков",     role: "Монтажник фасадных систем",               photo: m38 },
  { name: "Наталья Романова",    role: "Инженер по качеству",                     photo: m39 },
  { name: "Борис Афанасьев",     role: "Старший плотник",                         photo: m40 },
  { name: "Никита Воробьёв",     role: "Монтажник ГКЛ",                           photo: m41 },
  { name: "Григорий Соболев",    role: "Монтажник окон и витражей",               photo: m42 },
  { name: "Екатерина Зорина",    role: "Инженер по охране труда",                 photo: m43 },
  { name: "Сергей Лысенко",      role: "Инженер тепловых систем",                 photo: m44 },
  { name: "Артур Беляков",       role: "Помощник прораба",                        photo: m45 },
  { name: "Денис Прохоров",      role: "Маляр",                                   photo: m46 },
  { name: "Вера Никонова",       role: "Инженер-сметчик",                         photo: m47 },
  { name: "Валерий Сидоров",     role: "Мастер сантехнических систем",            photo: m48 },
  { name: "Алина Куликова",      role: "Архитектор",                              photo: m49 },
  { name: "Руслан Маркин",       role: "Заведующий складом",                      photo: m50 },
  { name: "Аслан Дудаев",        role: "Бригадир монолитных работ",               photo: m51 },
  { name: "Магомед Закаев",      role: "Каменщик",                                photo: m52 },
  { name: "Ислам Эдильгериев",   role: "Сварщик",                                 photo: m53 },
  { name: "Адам Кадыров",        role: "Плотник",                                 photo: m54 },
  { name: "Хасан Бакаев",        role: "Прораб",                                  photo: m55 },
  { name: "Хусейн Дадаев",       role: "Электромонтажник",                        photo: m56 },
  { name: "Рамзан Висаитов",     role: "Кровельщик",                              photo: m57 },
  { name: "Ахмед Алиханов",      role: "Бригадир общестроительных работ",         photo: m58 },
  { name: "Беслан Юсупов",       role: "Монтажник ГКЛ",                           photo: m59 },
  { name: "Анзор Тагаев",        role: "Штукатур-маляр",                          photo: m60 },
  { name: "Иса Хамзатов",        role: "Плиточник-облицовщик",                    photo: m61 },
  { name: "Муса Эльмурзаев",     role: "Бетонщик",                                photo: m62 },
  { name: "Тимур Сулейманов",    role: "Мастер-отделочник",                       photo: m63 },
  { name: "Шамиль Исраилов",     role: "Монтажник окон и фасадных систем",        photo: m64 },
  { name: "Заурбек Цечоев",      role: "Сантехник-монтажник",                     photo: m65 },
  { name: "Магомед Гаджиев",     role: "Бригадир отделочных работ",               photo: m66 },
  { name: "Расул Магомедов",     role: "Каменщик",                                photo: m67 },
  { name: "Гаджи Алиев",         role: "Электромонтажник",                        photo: m68 },
  { name: "Ибрагим Курбанов",    role: "Прораб",                                  photo: m69 },
  { name: "Шамиль Абдулаев",     role: "Плотник",                                 photo: m70 },
  { name: "Курбан Исаев",        role: "Сварщик аргонщик",                        photo: m71 },
  { name: "Али Османов",         role: "Кровельщик мягких кровель",               photo: m72 },
  { name: "Камиль Рамазанов",    role: "Штукатур",                                photo: m73 },
  { name: "Юсуп Магомедов",      role: "Плиточник",                               photo: m74 },
  { name: "Арсен Гасанов",       role: "Бригадир монолитных работ",               photo: m75 },
  { name: "Заур Ибрагимов",      role: "Монтажник систем вентиляции",             photo: m76 },
  { name: "Мурад Алибеков",      role: "Сантехник-монтажник",                     photo: m77 },
  { name: "Саид Меджидов",       role: "Монтажник фасадных систем",               photo: m78 },
  { name: "Абдул Нурмагомедов",  role: "Маляр",                                   photo: m79 },
  { name: "Магомедрасул Багиров", role: "Бетонщик",                               photo: m80 },
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
