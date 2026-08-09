/**
 * §12.1 ТЗ — короткая полоса доверия. Никаких выдуманных цифр
 * (количество объектов, лет на рынке и т. д.) — только фактические
 * принципы работы.
 */
import {
  FileSignature,
  Coins,
  CheckSquare,
  Ruler,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

const ITEMS = [
  { Icon: FileSignature, text: "Прямой договор с заказчиком" },
  { Icon: Coins, text: "Поэтапная оплата" },
  { Icon: CheckSquare, text: "Приёмка каждого этапа" },
  { Icon: Ruler, text: "Бесплатный замер" },
  { Icon: ClipboardList, text: "Фиксированная смета" },
  { Icon: ShieldCheck, text: "Гарантия 3 года" },
];

export function TrustBar() {
  return (
    <section
      aria-label="Принципы работы компании"
      className="border-y border-border bg-[color:var(--surface-deep)]"
    >
      <div className="container-page py-6">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
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