/**
 * Первый экран: короткое позиционирование слева и визуальная карта реальных
 * строительных процессов справа.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, ShieldCheck, Wrench } from "lucide-react";
import {
  engineeringPicture,
  monolithPicture,
  plumbingPicture,
  renovationPicture,
} from "@/assets/illustrations/sources";
import { SlotImage } from "@/components/common/SlotImage";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="container-page relative grid gap-10 py-10 md:py-14 lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-16">
        <div className="lg:col-span-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
            Специализация: черновой цикл под чистовую отделку
          </span>
          <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Штукатурка, стяжка и черновая инженерия по фиксированной цене.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Механизированная штукатурка, мокрая и полусухая стяжка пола, тёплый пол, разводка электрики и сантехники в Москве и области. Прайс без «от»: на сайте указана реальная стоимость работ, а не заниженная цифра для привлечения клиентов. Все дополнительные работы, если они действительно нужны на объекте, согласуем заранее — итог не становится неожиданно выше. Материалы заказчик покупает сам, а при необходимости мы закупим и доставим их отдельно.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="min-h-12">
              <Link to="/kalkulyator-stoimosti">
                Получить расчёт
                <ArrowRight aria-hidden="true" className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-h-12">
              <Link to="/how-we-work">Как мы работаем</Link>
            </Button>
          </div>

          <ul className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            <FactCard Icon={Building2} title="Цена не растёт" text="Все надбавки перечислены в смете до начала работ" />
            <FactCard Icon={Wrench} title="Пять направлений" text="Делаем только то, в чём специализируемся" />
            <FactCard Icon={ShieldCheck} title="Гарантия 3 года" text="Выезд и устранение за наш счёт" />
          </ul>
        </div>

        <HeroProcessVisual />
      </div>
    </section>
  );
}

function HeroProcessVisual() {
  return (
    <div className="hidden lg:col-span-6 lg:block">
      <div className="grid h-[440px] grid-cols-2 grid-rows-2 gap-4 sm:h-[520px] lg:h-[600px]">
        <ProcessImage
          slotKey="home.hero.screed"
          picture={monolithPicture}
          description="Рабочий процесс устройства бетонной стяжки на строительном объекте"
          index="01"
          label="Стяжка пола"
          className="row-span-2"
        />
        <ProcessImage
          slotKey="home.hero.heating"
          picture={heatingPicture}
          description="Монтаж контуров тёплого пола и коллекторного узла на объекте"
          index="02"
          label="Тёплый пол"
        />
        <ProcessImage
          slotKey="home.hero.engineering"
          picture={engineeringPicture}
          description="Собранный узел черновой инженерии с трубами и электрикой"
          index="03"
          label="Черновая инженерия"
          accent
        />
      </div>
    </div>
  );
}

function ProcessImage({
  slotKey,
  picture,
  description,
  index,
  label,
  className,
  accent = false,
}: {
  slotKey: string;
  picture: typeof monolithPicture;
  description: string;
  index: string;
  label: string;
  className?: string;
  accent?: boolean;
}) {
  return (
    <figure
      className={`group relative min-h-0 overflow-hidden rounded-2xl border bg-card shadow-2xl ${
        accent ? "border-primary/30" : "border-border"
      } ${className ?? ""}`}
    >
      <SlotImage
        slotKey={slotKey}
        picture={picture}
        description={description}
        imgClassName="h-full w-full object-cover grayscale-[0.15] transition-all duration-500 group-hover:grayscale-0 group-hover:scale-[1.03]"
        className="h-full w-full"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
      <figcaption className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-4 sm:p-5">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          {index}
        </span>
        <span className="text-sm font-semibold text-foreground sm:text-base">{label}</span>
      </figcaption>
    </figure>
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
