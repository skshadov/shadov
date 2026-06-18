/**
 * Универсальная заглушка для всех маршрутов §11 ТЗ, которые
 * пока не наполнены содержанием. На каждой такой странице в head()
 * установлен <meta name="robots" content="noindex, follow">.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, Construction } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";

interface RouteStubProps {
  title: string;
  shortLabel?: string;
  breadcrumbs: BreadcrumbItem[];
  description?: string;
}

export function RouteStub({
  title,
  shortLabel,
  breadcrumbs,
  description,
}: RouteStubProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex-1 surface-light">
        <div className="container-page py-10 md:py-16">
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Construction aria-hidden="true" className="h-3.5 w-3.5" />
              Раздел готовится
            </span>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl md:text-[44px]">
              {title}
            </h1>
            {shortLabel ? (
              <p className="mt-3 text-sm font-medium uppercase tracking-wider text-primary">
                {shortLabel}
              </p>
            ) : null}
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description ??
                "Раздел готовится. Полное наполнение появится на следующем этапе развития сайта — со структурой услуги, технологией работ, прайсом, примерами объектов и формой расчёта."}
            </p>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Если этот раздел нужен вам уже сейчас — отправьте короткий запрос через форму расчёта на главной, и мы свяжемся напрямую.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/" hash="estimate">
                  Получить расчёт
                  <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">На главную</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}