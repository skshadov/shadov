/**
 * §7 ТЗ — почему мы не обещаем самую низкую цену. Полный смысл.
 */
import { SectionHeading } from "@/components/common/SectionHeading";
import { Brain, Wrench, FileSignature, RefreshCcw } from "lucide-react";

const POINTS = [
  {
    Icon: Brain,
    title: "Инженерная подготовка",
    text: "Расчёты, узлы, технологическая карта, материалы и допуски — это работа, которую нельзя пропустить, если важен результат.",
  },
  {
    Icon: Wrench,
    title: "Квалификация и технология",
    text: "Опытные мастера, грамотные руководители и соблюдение технологии стоят денег. Это не место, где можно безопасно экономить.",
  },
  {
    Icon: FileSignature,
    title: "Ответственность по договору",
    text: "Мы отвечаем за результат по договору и по СРО. Эта ответственность тоже учитывается в стоимости работ.",
  },
  {
    Icon: RefreshCcw,
    title: "Переделка дороже",
    text: "Демонтаж скрытых работ, повторная закупка материалов и потерянное время на переделке обычно стоят дороже, чем правильное первоначальное выполнение.",
  },
];

export function QualityPriceSection() {
  return (
    <section className="surface-light border-b border-border">
      <div className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow="Почему мы не обещаем самую низкую цену"
          title="Профессиональная работа не может стоить дёшево"
          description="Мы не конкурируем по цене с теми, кто экономит на инженерной подготовке, квалификации специалистов и ответственности по договору. Объясняем, почему."
        />
        <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {POINTS.map(({ Icon, title, text }) => (
            <li key={title} className="rounded-lg border border-border bg-card p-6">
              <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-display text-lg font-semibold leading-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}