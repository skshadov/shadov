/**
 * §12.9 ТЗ + уточнение 3 — на Этапе 1 без вымышленных отзывов.
 */
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/common/SectionHeading";
import { PlaceholderNotice } from "@/components/common/PlaceholderNotice";

export function ReviewsPreview() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow="Отзывы"
          title="Только реальные отзывы реальных заказчиков"
          description="Отзывы публикуются после внутренней проверки в административной панели. На сайте показываются только подтверждённые и одобренные."
        />
        <div className="mt-10">
          <PlaceholderNotice
            title="Раздел наполняется подтверждёнными отзывами заказчиков"
            description="Мы не размещаем вымышленные отзывы и не покупаем «накрутку» рейтингов. Раздел появится по мере поступления реальных согласованных отзывов."
            action={
              <Button asChild variant="outline">
                <Link to="/reviews">Раздел «Отзывы»</Link>
              </Button>
            }
          />
        </div>
      </div>
    </section>
  );
}