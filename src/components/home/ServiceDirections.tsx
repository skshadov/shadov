/**
 * §12.2 ТЗ — основные направления. AI-иллюстрации на 4 верхних
 * карточках помечены через <Illustration>; остальные — иконочные.
 */
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { SlotImage } from "@/components/common/SlotImage";
import { SectionHeading } from "@/components/common/SectionHeading";
import { HOME_DIRECTIONS } from "@/data/home-services";
import {
  monolithPicture,
  photoPlasterPicture,
  photoScreedPicture,
  photoElectricalPicture,
  photoPlumbingPicture,
  photoWetScreedPicture,
  photoWarmFloorPicture,
} from "@/assets/illustrations/sources";

type PicBundle = typeof monolithPicture;
const ILLUSTRATIONS: Record<string, { pic: PicBundle; description: string; slotKey: string } | undefined> = {
  "Механизированная штукатурка": { pic: photoPlasterPicture, description: "штукатурная станция и подготовленные стены на объекте механизированной штукатурки" , slotKey: "direction.shtukaturka" },
  "Мокрая стяжка пола": { pic: photoWetScreedPicture, description: "залитая и выровненная цементно-песчаная стяжка пола на объекте" , slotKey: "direction.styazhka" },
  "Полусухая стяжка пола": { pic: photoScreedPicture, description: "затирка полусухой стяжки пола шлифовальной машиной в квартире" , slotKey: "direction.polusuhaya" },
  "Тёплый пол": { pic: photoWarmFloorPicture, description: "уложенный контур водяного тёплого пола на армирующей сетке перед стяжкой" , slotKey: "direction.teplyy-pol" },
  "Разводка электрики": { pic: photoElectricalPicture, description: "черновая электрика: кабельные трассы в гофре по полу и собранный электрощит" , slotKey: "direction.elektrika" },
  "Разводка сантехники": { pic: photoPlumbingPicture, description: "смонтированный узел водоснабжения: коллекторы, фильтры и бойлер" , slotKey: "direction.santehnika" },
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
                      <SlotImage
                        slotKey={ill.slotKey}
                        picture={ill.pic}
                        description={ill.description}
                        imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        className="h-full w-full"
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