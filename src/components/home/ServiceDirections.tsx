/**
 * §12.2 ТЗ — основные направления. AI-иллюстрации на 4 верхних
 * карточках помечены через <Illustration>; остальные — иконочные.
 */
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Illustration } from "@/components/common/Illustration";
import { SectionHeading } from "@/components/common/SectionHeading";
import { HOME_DIRECTIONS } from "@/data/home-services";

import housesImg from "@/assets/illustrations/direction-houses.jpg";
import renovationImg from "@/assets/illustrations/direction-renovation.jpg";
import monolithImg from "@/assets/illustrations/direction-monolith.jpg";
import engineeringImg from "@/assets/illustrations/direction-engineering.jpg";

const ILLUSTRATIONS: Record<string, { src: string; description: string } | undefined> = {
  "Строительство домов": {
    src: housesImg,
    description: "современный двухэтажный частный дом из газобетона с фальцевой кровлей",
  },
  "Ремонт под ключ": {
    src: renovationImg,
    description: "интерьер квартиры на этапе подготовки под чистовую отделку",
  },
  "Монолитные работы": {
    src: monolithImg,
    description: "монолитное перекрытие с армированием и бетонированием",
  },
  "Электрика": {
    src: engineeringImg,
    description: "инженерное помещение с коллектором, электрощитом и трассами",
  },
};

export function ServiceDirections() {
  return (
    <section className="surface-light border-b border-border">
      <div className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow="Основные направления"
          title="Что мы делаем для частных и корпоративных заказчиков"
          description="Полный цикл — от обследования объекта и инженерных решений до чистовой отделки и сдачи. По каждому направлению назначается ответственный руководитель проекта."
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
                        src={ill.src}
                        description={ill.description}
                        width={1280}
                        height={960}
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