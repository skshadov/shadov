/**
 * Мобильное меню (§10 + уточнение 10). Полноэкранный Sheet,
 * блокирует прокрутку фона (Radix Dialog), закрывается по Escape
 * и по выбору пункта. Вложенные разделы — Accordion.
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowRight, LogIn } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MAIN_NAV, isDropdown } from "@/data/navigation";
import { Logo } from "@/components/brand/Logo";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Открыть меню"
          className="lg:hidden min-h-11 min-w-11"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full max-w-sm flex-col gap-0 border-l border-border bg-background p-0 sm:max-w-md"
      >
        <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
          <SheetTitle asChild>
            <Logo variant="compact" />
          </SheetTitle>
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Закрыть меню"
              className="min-h-11 min-w-11"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <nav
          aria-label="Основное меню"
          className="flex-1 overflow-y-auto px-2 py-2"
        >
          <Accordion type="multiple" className="w-full">
            {MAIN_NAV.map((item) => {
              if (isDropdown(item)) {
                return (
                  <AccordionItem
                    key={item.to}
                    value={item.to}
                    className="border-b border-border last:border-b-0"
                  >
                    <AccordionTrigger className="px-3 py-3 text-base font-medium hover:no-underline">
                      {item.label}
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <ul className="flex flex-col gap-0.5 pl-3">
                        <li>
                          <Link
                            to={item.to}
                            onClick={() => setOpen(false)}
                            className="flex min-h-11 items-center rounded-md px-3 text-[13px] font-medium uppercase tracking-wider text-primary"
                          >
                            Все услуги раздела
                          </Link>
                        </li>
                        {item.items.map((sub) => (
                          <li key={sub.to}>
                            <Link
                              to={sub.to}
                              onClick={() => setOpen(false)}
                              className="flex min-h-11 items-center rounded-md px-3 text-sm text-foreground/90 hover:bg-accent"
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              }
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center border-b border-border px-3 py-3 text-base font-medium"
                >
                  {item.label}
                </Link>
              );
            })}
          </Accordion>
        </nav>

        <div className="flex flex-col gap-2 border-t border-border bg-card/40 px-4 py-4">
          <Button asChild className="min-h-11 w-full">
            <Link to="/kalkulyator-stoimosti" onClick={() => setOpen(false)}>
              Получить расчёт
              <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11 w-full">
            <Link to="/login" onClick={() => setOpen(false)}>
              <LogIn aria-hidden="true" className="mr-1 h-4 w-4" />
              Личный кабинет
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}