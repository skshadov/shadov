/**
 * §12.1 ТЗ — первый экран. AI-иллюстрация помечена через
 * <Illustration>, не выдаётся за реальный объект.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Building2, Wrench } from "lucide-react";
import { heroPicture } from "@/assets/illustrations/sources";
import { Illustration } from "@/components/common/Illustration";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="absolute inset-0 -z-10">
        <Illustration
          src={heroPicture.src}
          sources={heroPicture.sources}
          imgSrcSet={heroPicture.imgSrcSet}
          imgSizes={heroPicture.imgSizes}
          description="туманное утро на стройплощадке частного многоквартирного дома, монолитный каркас, бригада в касках"
          width={heroPicture.width}
          height={heroPicture.height}
          priority
          caption={false}
          rounded={false}
          imgClassName="h-full w-full object-cover opacity-30"
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      <div className="container-page relative grid gap-10 py-14 md:py-20 lg:grid-cols-12 lg:gap-12 lg:py-28">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
            Генеральный подрядчик. Допуск СРО.
          </span>
          <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Строим и ремонтируем под ключ — по прямому договору с заказчиком.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Частные и многоквартирные дома, ремонт квартир и домов, монолит, кладка, кровля, фасады, инженерные системы и плитка. Поэтапная оплата, ежедневные отчёты и личный кабинет с онлайн-камерами на каждом комплексном объекте.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="min-h-12">
              <Link to="/" hash="estimate">
                Получить расчёт
                <ArrowRight aria-hidden="true" className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-h-12">
              <Link to="/how-we-work">Как мы работаем</Link>
            </Button>
          </div>

          <ul className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            <FactCard Icon={Building2} title="Прямой договор" text="С собственником, застройщиком или официальным техзаказчиком" />
            <FactCard Icon={Wrench} title="Поэтапная оплата" text="Аванс — только на текущий этап работ" />
            <FactCard Icon={ShieldCheck} title="Контроль 24/7" text="Личный кабинет, отчёты и онлайн-камеры" />
          </ul>
        </div>
      </div>
    </section>
  );
}

function FactCard({
  Icon,
  title,
  text,
}: {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  text: string;
}) {
  return (
    <li className="rounded-lg border border-border bg-card/70 p-4 backdrop-blur-sm">
      <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
    </li>
  );
}