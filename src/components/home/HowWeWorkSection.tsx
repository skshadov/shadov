/**
 * Как начинается работа — пошаговая визуализация (§3 + §4 + §13 ТЗ).
 */
import { SectionHeading } from "@/components/common/SectionHeading";

const STEPS = [
  { n: "01", title: "Заявка и короткий разговор", text: "Вы оставляете запрос. Менеджер уточняет задачу и предлагает удобное время для разговора." },
  { n: "02", title: "Обследование объекта", text: "Технический специалист изучает объект, фиксирует существующее состояние и инженерные ограничения." },
  { n: "03", title: "Решение и смета", text: "Готовим техническое решение, состав работ и постатейную смету. Объясняем, что входит и что считается отдельно." },
  { n: "04", title: "Договор и график", text: "Подписываем прямой договор. Утверждаем разбивку на этапы, плановый график и порядок приёмки." },
  { n: "05", title: "Подготовка площадки", text: "Логистика, материалы, ограждение, бытовые условия для бригады, согласования с управляющей компанией при необходимости." },
  { n: "06", title: "Работа по этапам", text: "Выполнение и приёмка каждого этапа в личном кабинете. Ежедневные отчёты и доступ к онлайн-камерам." },
  { n: "07", title: "Сдача и гарантия", text: "Итоговая приёмка, документы, гарантийные обязательства, инструкция по эксплуатации инженерных систем." },
];

export function HowWeWorkSection() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow="Как начинается работа"
          title="Понятный путь от заявки до сдачи объекта"
          description="Каждый шаг зафиксирован. На любом этапе вы видите, что происходит и кто за это отвечает."
        />
        <ol className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-lg border border-border bg-card p-5">
              <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {s.n}
              </span>
              <h3 className="mt-2 font-display text-base font-semibold leading-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}