/**
 * §12.8 ТЗ + уточнение 4 — СРО и документы без выдуманных номеров.
 */
import { SectionHeading } from "@/components/common/SectionHeading";
import { PlaceholderNotice } from "@/components/common/PlaceholderNotice";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, FileText, ScrollText } from "lucide-react";

const CARDS = [
  {
    Icon: ShieldCheck,
    title: "Выписка из реестра СРО",
    text: "Подтверждает допуск к организации строительства как генерального подрядчика. Номер и реестровая ссылка публикуются после загрузки документа через административную панель.",
  },
  {
    Icon: FileText,
    title: "Регистрационные документы компании",
    text: "Свидетельства, ОГРН, ИНН и реквизиты публикуются на странице «Реквизиты» сразу после их внесения в систему.",
  },
  {
    Icon: ScrollText,
    title: "Лицензии и сертификаты по отдельным работам",
    text: "Карточки документов появляются здесь по мере подтверждения и загрузки. Никаких отсканированных «для красоты» документов мы не публикуем.",
  },
];

export function DocumentsSection() {
  return (
    <section className="surface-light border-b border-border">
      <div className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow="СРО и документы"
          title="Все документы публикуются на сайте только после подтверждения"
          description="Мы не выводим в публичную часть никаких незаполненных реквизитов и фиктивных номеров. Каждый документ загружается через административную панель и привязывается к карточке."
        />
        <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {CARDS.map(({ Icon, title, text }) => (
            <li key={title} className="rounded-lg border border-border bg-card p-5">
              <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
              <p className="mt-3 font-display text-base font-semibold leading-tight">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground/80">
                Заполняется через административную панель
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/sro-i-dokumenty">Раздел СРО и документы</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/requisites">Реквизиты компании</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}