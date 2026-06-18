/**
 * §3 ТЗ — работа напрямую с заказчиком. Текст переформулирован,
 * но смысл сохранён (требование уточнения 12).
 */
import { SectionHeading } from "@/components/common/SectionHeading";
import { FileSignature, Users, Wallet, ShieldCheck } from "lucide-react";

const POINTS = [
  {
    Icon: FileSignature,
    title: "Договор без посредников",
    text: "Мы заключаем договор непосредственно с собственником объекта, застройщиком или официально уполномоченным техническим заказчиком.",
  },
  {
    Icon: Users,
    title: "Никаких посреднических цепочек",
    text: "Мы не работаем через посредников, перепродающих ваш объект. Ответственность за результат лежит на нас, а не на цепочке партнёров.",
  },
  {
    Icon: Wallet,
    title: "Прозрачные деньги",
    text: "Все расчёты идут напрямую: вы оплачиваете работу исполнителю, а не наценку посредника. Это снижает риск конфликта интересов и удорожания.",
  },
  {
    Icon: ShieldCheck,
    title: "Личный контроль",
    text: "Заказчик лично контролирует стоимость, сроки и качество — через личный кабинет, ежедневные отчёты и приёмку каждого этапа.",
  },
];

export function DirectContractSection() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow="Прямой договор"
          title="Мы работаем напрямую с заказчиком, без посредников"
          description="Этот принцип — основа всех наших отношений с клиентом. Он определяет, как мы оформляем документы, считаем деньги и распределяем ответственность."
        />
        <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {POINTS.map(({ Icon, title, text }) => (
            <li key={title} className="rounded-lg border border-border bg-card p-5">
              <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-display text-base font-semibold leading-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}