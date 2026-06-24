/**
 * Мобильное меню (§10 + уточнение 10). Открывается обычной кнопкой,
 * блокирует прокрутку фона, закрывается по Escape, по фону и по выбору пункта.
 * Вложенные разделы — Accordion.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, ArrowRight, LogIn, X } from "lucide-react";

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Открыть меню"
        aria-controls="mobile-navigation-panel"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="relative z-[60] inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
      >
        <Menu aria-hidden="true" className="h-5 w-5" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-navigation-title"
        >
          <button
            type="button"
            aria-label="Закрыть меню"
            className="absolute inset-0 cursor-default bg-[color:var(--scrim)]"
            onClick={() => setOpen(false)}
          />

          <aside
            id="mobile-navigation-panel"
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col gap-0 border-l border-border bg-background shadow-lg sm:max-w-md"
          >
            <div className="flex flex-row items-center justify-between border-b border-border px-4 py-3 pr-14">
              <h2 id="mobile-navigation-title" className="sr-only">
                Основное меню
              </h2>
              <Logo variant="compact" />
              <button
                ref={closeRef}
                type="button"
                aria-label="Закрыть меню"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

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
          </aside>
        </div>
      ) : null}
    </>
  );
}