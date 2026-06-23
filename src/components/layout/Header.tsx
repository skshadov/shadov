/**
 * Шапка сайта (§10 + уточнения 9–10). Sticky, при скролле слегка
 * уплотняется. Содержит skip-link, верхнюю инфо-полосу,
 * desktop и mobile навигацию, CTA «Личный кабинет», «Получить расчёт».
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, LogIn } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { DesktopNavigation } from "./DesktopNavigation";
import { MobileNavigation } from "./MobileNavigation";
import { TopInfoBar } from "./TopInfoBar";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Перейти к содержимому
      </a>
      <header
        className={`sticky top-0 z-50 border-b transition-colors ${
          scrolled
            ? "border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
            : "border-transparent bg-background"
        }`}
      >
        <TopInfoBar />
        <div
          className={`container-page flex min-w-0 items-center justify-between gap-3 transition-[height] ${
            scrolled ? "h-14" : "h-16 md:h-20"
          }`}
        >
          <Logo
            variant="full"
            className="shrink-0 text-foreground [&_[data-logo-subtitle]]:hidden 2xl:[&_[data-logo-subtitle]]:block"
          />

          <DesktopNavigation />

          <div className="flex shrink-0 items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex"
              aria-label="Личный кабинет"
            >
              <Link to="/login">
                <LogIn aria-hidden="true" className="h-4 w-4 2xl:mr-1" />
                <span className="hidden 2xl:inline">Личный кабинет</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link to="/kalkulyator-stoimosti">
                Получить расчёт
                <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <MobileNavigation />
          </div>
        </div>
      </header>
    </>
  );
}