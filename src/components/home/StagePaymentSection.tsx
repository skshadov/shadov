/**
 * §4 + §12.5 ТЗ — поэтапная оплата. 7 шагов из ТЗ.
 */
import { SectionHeading } from "@/components/common/SectionHeading";

const STEPS = [
  { n: "1", title: "Деление объекта на этапы", text: "Объём заранее делится на технологически понятные этапы (например, фундамент, коробка, кровля, инженерия, отделка)." },
  { n: "2", title: "Аванс только на текущий этап", text: "Перед началом этапа заказчик вносит предусмотренный договором аванс именно на этот этап, а не на весь объект сразу." },
  { n: "3", title: "Выполнение работ", text: "Назначенная бригада выполняет работы этапа в соответствии с проектом, технологией и графиком." },
  { n: "4", title: "Проверка качества", text: "Инженер компании проверяет качество скрытых и видимых работ, оформляет внутренний контроль." },
  { n: "5", title: "Отчётность и приёмка", text: "Заказчик получает отчёт и принимает этап в личном кабинете. По замечанию формируется задача ответственному сотруднику." },
  { n: "6", title: "Авансирование следующего этапа", text: "После приёмки авансируется следующий этап. Заказчик не оплачивает весь объект заранее." },
  { n: "7", title: "Финальная сдача и документы", text: "После завершения всех этапов оформляется итоговая приёмка, гарантийные обязательства и комплект документов." },
];

export function StagePaymentSection() {
  return (
    <section className="surface-light border-b border-border">
      <div className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow="Поэтапная оплата"
          title="Вы платите за каждый этап отдельно — не за весь объект сразу"
          description="Такая модель защищает обе стороны: заказчик не финансирует риски подрядчика заранее, а подрядчик получает понятный, защищённый ритм работы."
        />
        <ol className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-lg border border-border bg-card p-5">
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-primary px-2 font-display text-sm font-semibold text-primary-foreground">
                {s.n}
              </span>
              <h3 className="mt-3 font-display text-base font-semibold leading-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}