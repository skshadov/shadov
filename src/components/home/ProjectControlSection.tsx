/**
 * §5 + §12.4 ТЗ — контроль и личный кабинет. AI-фото инженера
 * с планшетом помечено как иллюстрация.
 */
import { Link } from "@tanstack/react-router";
import {
  Camera,
  ClipboardList,
  Activity,
  MessageSquare,
  CalendarClock,
  FileText,
} from "lucide-react";
import { Illustration } from "@/components/common/Illustration";
import { SectionHeading } from "@/components/common/SectionHeading";
import { controlPicture } from "@/assets/illustrations/sources";
import { Button } from "@/components/ui/button";

const ITEMS = [
  { Icon: Activity, title: "Текущий этап и % готовности", text: "Видно, какой этап идёт сейчас и какая доля объекта завершена." },
  { Icon: CalendarClock, title: "Плановый и фактический график", text: "Сравнение план/факт по срокам в одной таблице." },
  { Icon: ClipboardList, title: "Ежедневные отчёты", text: "Фотофиксация, выполненные работы, замечания инженера." },
  { Icon: Camera, title: "Онлайн-камеры на объекте", text: "Доступ к камерам через защищённое соединение из кабинета." },
  { Icon: MessageSquare, title: "Сообщения с руководителем проекта", text: "Переписка по объекту с полной историей." },
  { Icon: FileText, title: "Сметы, счета, оплаты, документы", text: "Все документы по объекту собраны в одном месте." },
];

export function ProjectControlSection() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container-page grid gap-10 py-16 md:py-24 lg:grid-cols-2 lg:gap-16 lg:items-center">
        <div>
          <SectionHeading
            eyebrow="Контроль строительства"
            title="Личный кабинет — на каждом комплексном объекте"
            description="Для каждого комплексного проекта создаётся отдельный личный кабинет заказчика. Это рабочий инструмент, а не витрина — здесь живёт вся информация по вашему объекту."
          />
          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ITEMS.map(({ Icon, title, text }) => (
              <li key={title} className="rounded-lg border border-border bg-card p-4">
                <Icon aria-hidden="true" className="h-4 w-4 text-primary" />
                <p className="mt-2 text-sm font-semibold leading-tight">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/login">Войти в кабинет</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/how-we-work">Подробнее о процессе</Link>
            </Button>
          </div>
        </div>
        <Illustration
          src={controlPicture.src}
          sources={controlPicture.sources}
          imgSrcSet={controlPicture.imgSrcSet}
          imgSizes={controlPicture.imgSizes}
          description="инженер на стройплощадке проверяет рабочую документацию на планшете"
          width={controlPicture.width}
          height={controlPicture.height}
          className="overflow-hidden rounded-xl border border-border"
        />
      </div>
    </section>
  );
}