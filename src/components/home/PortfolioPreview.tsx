/**
 * §12.6 ТЗ + уточнение 3: на Этапе 1 — без выдуманных кейсов,
 * только честный плейсхолдер.
 */
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/common/SectionHeading";
import { PlaceholderNotice } from "@/components/common/PlaceholderNotice";

export function PortfolioPreview() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow="Наши работы"
          title="Реальные объекты публикуются только с подтверждённой информацией"
          description="Здесь будут реальные объекты с фотографиями, объёмами и сроками. Раздел наполняется по мере получения согласований от заказчиков."
        />
        <div className="mt-10">
          <PlaceholderNotice
            title="Раздел наполняется подтверждёнными материалами выполненных объектов"
            description="Чтобы не показывать ничего вымышленного, мы публикуем здесь только реальные объекты с реальными адресами, объёмами и согласием заказчика. Иллюстрации в этом разделе не используются."
            action={
              <Button asChild variant="outline">
                <Link to="/portfolio">Перейти в раздел</Link>
              </Button>
            }
          />
        </div>
      </div>
    </section>
  );
}