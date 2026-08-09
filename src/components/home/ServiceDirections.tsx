/**
 * §12.2 ТЗ — основные направления. AI-иллюстрации на 4 верхних
 * карточках помечены через <Illustration>; остальные — иконочные.
 */
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Illustration } from "@/components/common/Illustration";
import { SectionHeading } from "@/components/common/SectionHeading";
import { HOME_DIRECTIONS } from "@/data/home-services";
import {
  renovationPicture,
  monolithPicture,
  engineeringPicture,
  plumbingPicture,
  heatingPicture,
  semidryPicture,
} from "@/assets/illustrations/sources";

type PicBundle = typeof renovationPicture;
const ILLUSTRATIONS: Record<string, { pic: PicBundle; description: string } | undefined> = {
  "Механизированная штукатурка": { pic: renovationPicture, description: "оштукатуренные стены квартиры на этапе подготовки под чистовую отделку" },
  "Мокрая стяжка пола": { pic: monolithPicture, description: "заливка и выравнивание цементно-песчаной стяжки пола" },
  "Полусухая стяжка пола": { pic: semidryPicture, description: "механизированная укладка полусухой стяжки пола с затиркой шлифовальной машиной" },
  "Тёплый пол": { pic: heatingPicture, description: "укладка водяного тёплого пола с коллектором" },
  "Разводка электрики": { pic: engineeringPicture, description: "черновая электрика: штробы, кабельные трассы и электрощит" },
  "Разводка сантехники": { pic: plumbingPicture, description: "черновая разводка водоснабжения и канализации в санузле" },
};

export function ServiceDirections() {
  return (
    <section className="surface-light border-b border-border">
      <div className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow="Наши направления"
          title="Пять работ чернового цикла, на которых мы специализируемся"
          description="Штукатурка, мокрая стяжка, тёплый пол и черновая инженерия в квартирах и домах Москвы и области. Цены указаны только за работу и фиксируются в смете до старта — материалы покупает заказчик."
        />
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {HOME_DIRECTIONS.map((d) => {
            const ill = ILLUSTRATIONS[d.title];
            return (
              <li key={d.title}>
                <Link
                  to={d.to}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/60"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {ill ? (
                      <Illustration
                        src={ill.pic.src}
                        sources={ill.pic.sources}
                        imgSrcSet={ill.pic.imgSrcSet}
                        imgSizes={ill.pic.imgSizes}
                        description={ill.description}
                        width={ill.pic.width}
                        height={ill.pic.height}
                        imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        className="h-full w-full"
                        rounded={false}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[color:var(--surface-medium)]">
                        <d.Icon aria-hidden="true" className="h-12 w-12 text-primary/70" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-semibold leading-tight">{d.title}</h3>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary"
                      />
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{d.description}</p>
                    <p className="mt-auto text-xs font-medium uppercase tracking-wider text-primary">
                      {d.startPrice}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}