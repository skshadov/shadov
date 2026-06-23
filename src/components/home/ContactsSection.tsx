/**
 * §12 ТЗ — контакты в нижней части главной. Все плейсхолдеры
 * скрываются, если поле не заполнено (уточнение 4).
 */
import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone, ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { PlaceholderNotice } from "@/components/common/PlaceholderNotice";
import { Button } from "@/components/ui/button";
import { company, isFilled } from "@/config/company";
import { MessengerLinks } from "@/components/common/MessengerLinks";

export function ContactsSection() {
  const items: { Icon: typeof Phone; label: string; value: string; href?: string }[] = [];
  if (isFilled(company.phone))
    items.push({ Icon: Phone, label: "Телефон", value: company.phone, href: `tel:${company.phoneE164 || company.phone}` });
  if (isFilled(company.email))
    items.push({ Icon: Mail, label: "Email", value: company.email, href: `mailto:${company.email}` });
  if (isFilled(company.officeAddress))
    items.push({ Icon: MapPin, label: "Офис", value: company.officeAddress });

  return (
    <section id="contacts" className="scroll-mt-24 border-b border-border bg-[color:var(--surface-deep)]">
      <div className="container-page grid gap-10 py-16 md:py-24 lg:grid-cols-2 lg:gap-16">
        <SectionHeading
          eyebrow="Контакты"
          title="Свяжитесь с нами напрямую"
          description="Заявка через сайт обрабатывается менеджером компании. Если удобнее — выберите подходящий канал связи."
        />

        <div className="flex flex-col gap-6">
          {items.length > 0 ? (
            <>
            <ul className="grid gap-3">
              {items.map(({ Icon, label, value, href }) => (
                <li key={label} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                    {href ? (
                      <a href={href} className="text-base font-medium hover:text-primary">{value}</a>
                    ) : (
                      <p className="text-base font-medium">{value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Мессенджеры</p>
              <MessengerLinks />
            </div>
            </>
          ) : (
            <PlaceholderNotice
              variant="soft"
              title="Прямые контакты появятся после публикации"
              description="Телефон, email и адрес офиса заполняются через административную панель компании. До этого момента воспользуйтесь калькулятором стоимости — мы свяжемся."
              action={
                <Button asChild>
                  <Link to="/kalkulyator-stoimosti">
                    Рассчитать стоимость
                    <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              }
            />
          )}

          <Button asChild variant="outline" className="self-start">
            <Link to="/contacts">Все контакты</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}