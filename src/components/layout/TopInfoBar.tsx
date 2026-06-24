/**
 * Верхняя информационная полоса. Регион работы и обещание прямого
 * договора (§1 + §3 ТЗ). На мобильном — крупная одна строка.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, LogIn, MapPin, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { company, isFilled } from "@/config/company";

export function TopInfoBar() {
  return (
    <div className="hidden border-b border-border/40 bg-[color:var(--surface-deep)] text-[12px] text-muted-foreground md:block">
      <div className="container-page flex h-10 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-5">
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
            Москва и Московская область — другие регионы по согласованию
          </span>
          <span className="hidden xl:inline-flex items-center gap-1.5">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Прямой договор с заказчиком. Без посредников.
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isFilled(company.phone) && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 px-3 text-[12px] whitespace-nowrap"
            >
              <a href={`tel:${company.phoneE164 || company.phone}`}>
                <Phone aria-hidden="true" className="h-3.5 w-3.5 mr-1" />
                {company.phone}
              </a>
            </Button>
          )}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[12px] whitespace-nowrap"
          >
            <Link to="/login">
              <LogIn aria-hidden="true" className="h-3.5 w-3.5 mr-1" />
              Личный кабинет
            </Link>
          </Button>
          <Button asChild size="sm" className="h-7 px-3 text-[12px] whitespace-nowrap">
            <Link to="/kalkulyator-stoimosti">
              Получить расчёт
              <ArrowRight aria-hidden="true" className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}