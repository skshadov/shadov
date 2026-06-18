/**
 * Верхняя информационная полоса. Регион работы и обещание прямого
 * договора (§1 + §3 ТЗ). На мобильном — крупная одна строка.
 */
import { Link } from "@tanstack/react-router";
import { MapPin, ShieldCheck } from "lucide-react";

export function TopInfoBar() {
  return (
    <div className="hidden border-b border-border/40 bg-[color:var(--surface-deep)] text-[12px] text-muted-foreground md:block">
      <div className="container-page flex h-9 items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
            Москва и Московская область — другие регионы по согласованию
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Прямой договор с заказчиком. Без посредников.
          </span>
        </div>
        <Link
          to="/how-we-work"
          className="rounded-sm px-1 transition-colors hover:text-foreground"
        >
          Как мы работаем
        </Link>
      </div>
    </div>
  );
}