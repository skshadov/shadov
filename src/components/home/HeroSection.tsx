/**
 * Первый экран: короткое позиционирование слева и визуальная карта реальных
 * строительных процессов справа.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, ShieldCheck, Wrench } from "lucide-react";
import {
  engineeringPicture,
  heatingPicture,
  monolithPicture,
} from "@/assets/illustrations/sources";
import { Illustration } from "@/components/common/Illustration";
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
            Механизированная штукатурка, мокрая стяжка пола, тёплый пол, разводка электрики и сантехники в Москве и области. Прайс без «от»: цены только за работу, материалы заказчик покупает сам — при необходимости закупим и доставим, это обсуждается отдельно.
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
    <div className="relative min-h-[430px] lg:col-span-6 lg:min-h-[620px]">
      <div className="grid h-full min-h-[430px] grid-cols-10 grid-rows-10 gap-3 sm:min-h-[540px] lg:min-h-[620px]">
        <ProcessImage
          picture={monolithPicture}
          description="Рабочий процесс устройства бетонной стяжки на строительном объекте"
          label="Стяжка пола"
          detail="Заливка и выравнивание"
          className="col-span-8 col-start-3 row-span-6 row-start-1"
          labelPosition="bottom"
        />
        <ProcessImage
          picture={heatingPicture}
          description="Монтаж контуров тёплого пола и коллекторного узла на объекте"
          label="Тёплый пол"
          detail="Контуры и коллектор"
          className="col-span-7 col-start-1 row-span-5 row-start-6"
          labelPosition="bottom"
        />
        <ProcessImage
          picture={engineeringPicture}
          description="Собранный узел черновой инженерии с трубами и электрикой"
          label="Черновая инженерия"
          detail="Сантехника и электрика"
          className="col-span-4 col-start-1 row-span-3 row-start-4 sm:col-span-3"
          labelPosition="top"
        />
      </div>
    </div>
  );
}

function ProcessImage({
  picture,
  description,
  label,
  detail,
  className,
  labelPosition,
}: {
  picture: typeof monolithPicture;
  description: string;
  label: string;
  detail: string;
  className: string;
  labelPosition: "top" | "bottom";
}) {
  return (
    <figure
      className={`group relative min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-2xl transition-transform duration-700 ${className} ${
        labelPosition === "top" ? "hover:-translate-y-1" : "hover:translate-y-1"
      }`}
    >
      <Illustration
        src={picture.src}
        sources={picture.sources}
        imgSrcSet={picture.imgSrcSet}
        imgSizes={picture.imgSizes}
        description={description}
        width={picture.width}
        height={picture.height}
        priority
        caption={false}
        rounded={false}
        imgClassName="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        className="h-full w-full"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />
      <figcaption className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-4 sm:p-5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          {label}
        </span>
        <span className="text-sm font-semibold text-foreground sm:text-base">{detail}</span>
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
