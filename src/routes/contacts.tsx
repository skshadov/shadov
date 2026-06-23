import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator, ArrowRight } from "lucide-react";
import { InfoPageLayout, InfoSection, InfoList, buildInfoHead } from "@/components/info/InfoPageLayout";
import { PlaceholderNotice } from "@/components/common/PlaceholderNotice";
import { Button } from "@/components/ui/button";
import { company, isFilled, regions } from "@/config/company";
import { MessengerLinks } from "@/components/common/MessengerLinks";

const PATH = "/contacts";
const TITLE = "Контакты — Шадов и партнёры";
const DESC = "Свяжитесь с компанией «Шадов и партнёры». Москва и Московская область. Прямой договор с заказчиком, поэтапная оплата.";

export const Route = createFileRoute("/contacts")({
  head: () => buildInfoHead({
    title: TITLE,
    description: DESC,
    path: PATH,
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "Контакты", path: PATH },
    ],
  }),
  component: Page,
});

function Page() {
  const items: { label: string; value: string; href?: string }[] = [];
  if (isFilled(company.phone)) {
    items.push({ label: "Телефон", value: company.phone, href: `tel:${company.phoneE164 || company.phone}` });
  }
  if (isFilled(company.email)) {
    items.push({ label: "Email", value: company.email, href: `mailto:${company.email}` });
  }
  if (isFilled(company.telegram)) {
    items.push({ label: "Telegram", value: company.telegram, href: company.telegram });
  }
  if (isFilled(company.whatsapp)) {
    items.push({ label: "WhatsApp", value: company.whatsapp, href: company.whatsapp });
  }
  if (isFilled(company.officeAddress)) {
    items.push({ label: "Офис", value: company.officeAddress });
  }
  if (isFilled(company.workingHours)) {
    items.push({ label: "Часы связи", value: company.workingHours });
  }

  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Контакты" }]}
      h1="Контакты"
      intro={<p>{company.brandFull}. Работаем в Москве и Московской области по прямому договору.</p>}
    >
      <InfoSection title="Способы связи">
        {items.length > 0 ? (
          <>
          <ul className="space-y-2 text-base leading-relaxed">
            {items.map((it) => (
              <li key={it.label} className="flex flex-wrap gap-x-3">
                <span className="text-muted-foreground">{it.label}:</span>
                {it.href ? (
                  <a href={it.href} className="text-primary underline underline-offset-2 hover:opacity-80">{it.value}</a>
                ) : (
                  <span>{it.value}</span>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Мессенджеры</p>
            <MessengerLinks />
          </div>
          </>
        ) : (
          <PlaceholderNotice
            title="Контактные данные будут опубликованы после заполнения и проверки реквизитов"
            description="Телефон, email и адрес офиса заполняются через административную панель. До этого момента публичные технические значения не отображаются."
          />
        )}
      </InfoSection>

      <InfoSection title="География работ">
        <InfoList items={regions} />
      </InfoSection>

      <InfoSection title="Карта">
        <div
          aria-label="Карта офиса появится после публикации адреса"
          className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-sm text-muted-foreground"
        >
          Карта появится после публикации адреса офиса.
        </div>
      </InfoSection>

      <InfoSection title="Предварительный расчёт">
        <p className="text-sm text-muted-foreground">
          Чтобы оценить стоимость и получить смету — откройте калькулятор
          предварительной стоимости. Менеджер свяжется по результатам расчёта.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/kalkulyator-stoimosti">
              <Calculator aria-hidden="true" className="mr-2 h-4 w-4" />
              Открыть калькулятор
              <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Условия обработки данных — в{" "}
          <Link to="/privacy" className="text-primary underline underline-offset-2 hover:opacity-80">политике конфиденциальности</Link>{" "}
          и{" "}
          <Link to="/personal-data-consent" className="text-primary underline underline-offset-2 hover:opacity-80">согласии на обработку персональных данных</Link>.
        </p>
      </InfoSection>
    </InfoPageLayout>
  );
}
