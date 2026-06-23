/**
 * §12.7 ТЗ + уточнение 4: на Этапе 1 — без выдуманных фамилий.
 */
import { SectionHeading } from "@/components/common/SectionHeading";
import { Users } from "lucide-react";

const ROLES = [
  { title: "Руководитель проекта", text: "Назначается на ваш объект и отвечает за результат." },
  { title: "Инженер по контролю качества", text: "Проверяет скрытые работы и фиксирует промежуточные приёмки." },
  { title: "Прораб и бригада", text: "Закреплённые мастера с профильной подготовкой и допусками." },
  { title: "Сметчик и менеджер", text: "Готовят смету и сопровождают вас по документам и платежам." },
];

export function TeamPreview() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow="Команда"
          title="Кто будет работать на вашем объекте"
          description="Сотрудники — граждане Российской Федерации, с практическим опытом, профильной подготовкой и необходимыми допусками."
        />
        <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <li key={r.title} className="rounded-lg border border-border bg-card p-5">
              <Users aria-hidden="true" className="h-5 w-5 text-primary" />
              <p className="mt-3 font-display text-base font-semibold leading-tight">{r.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}