/**
 * §12.1 ТЗ — короткая полоса доверия. Никаких выдуманных цифр
 * (количество объектов, лет на рынке и т. д.) — только фактические
 * принципы работы.
 */
import {
  FileSignature,
  Coins,
  CheckSquare,
  Camera,
  ClipboardList,
  ShieldCheck,
  UserCheck,
  GraduationCap,
} from "lucide-react";

const ITEMS = [
  { Icon: FileSignature, text: "Прямой договор с заказчиком" },
  { Icon: Coins, text: "Поэтапная оплата" },
  { Icon: CheckSquare, text: "Приёмка каждого этапа" },
  { Icon: Camera, text: "Онлайн-камеры на объекте" },
  { Icon: ClipboardList, text: "Ежедневные отчёты" },
  { Icon: ShieldCheck, text: "Допуск СРО на генподряд" },
  { Icon: UserCheck, text: "Сотрудники — граждане РФ" },
  { Icon: GraduationCap, text: "Профильная подготовка" },
];

export function TrustBar() {
  return (
    <section
      aria-label="Принципы работы компании"
      className="border-y border-border bg-[color:var(--surface-deep)]"
    >
      <div className="container-page py-6">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4 lg:grid-cols-8">
          {ITEMS.map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-2 text-muted-foreground">
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
              <span className="leading-tight">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}