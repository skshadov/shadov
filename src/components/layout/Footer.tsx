/**
 * Подвал. 4 колонки: направления, информация, юридические,
 * контакты. Контакты скрываются, если плейсхолдеры не заполнены
 * (см. company.ts + isFilled).
 */
import { Link } from "@tanstack/react-router";
import {
  NAV_STROITELSTVO,
  NAV_REMONT,
  NAV_INZHENERNYE,
  FOOTER_INFO_LINKS,
  FOOTER_LEGAL_LINKS,
} from "@/data/navigation";
import { company, isFilled } from "@/config/company";
import { Logo } from "@/components/brand/Logo";
import { PlaceholderNotice } from "@/components/common/PlaceholderNotice";

const SERVICE_COLUMNS = [
  { title: "Строительство", items: NAV_STROITELSTVO.items, hub: NAV_STROITELSTVO.to },
  { title: "Ремонт", items: NAV_REMONT.items, hub: NAV_REMONT.to },
  { title: "Инженерные системы", items: NAV_INZHENERNYE.items, hub: NAV_INZHENERNYE.to },
];

export function Footer() {
  const hasAnyContact =
    isFilled(company.phone) ||
    isFilled(company.email) ||
    isFilled(company.officeAddress) ||
    isFilled(company.telegram) ||
    isFilled(company.whatsapp);

  return (
    <footer className="border-t border-border bg-[color:var(--surface-deep)] text-foreground">
      <div className="container-page grid gap-10 py-12 md:grid-cols-12 md:py-16">
        <div className="md:col-span-4">
          <Logo variant="full" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {company.brandFull}. Генеральный подрядчик с допуском СРО. Строительство и ремонт под ключ в Москве и Московской области.
          </p>
          <p className="mt-4 inline-flex rounded-md border border-border bg-card/40 px-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground">
            Прямой договор. Без посредников.
          </p>
        </div>

        <div className="grid gap-8 md:col-span-8 md:grid-cols-3">
          {SERVICE_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
                {col.title}
              </h3>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                {col.items.slice(0, 6).map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="hover:text-foreground">
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to={col.hub}
                    className="text-xs font-medium uppercase tracking-wider text-primary hover:underline"
                  >
                    Все услуги раздела
                  </Link>
                </li>
              </ul>
            </div>
          ))}
        </div>

        <div className="md:col-span-6">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider">
            Компания
          </h3>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            {FOOTER_INFO_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-6">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider">
            Контакты
          </h3>
          {hasAnyContact ? (
            <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              {isFilled(company.phone) ? (
                <li>
                  <a
                    href={`tel:${company.phoneE164 || company.phone}`}
                    className="hover:text-foreground"
                  >
                    {company.phone}
                  </a>
                </li>
              ) : null}
              {isFilled(company.email) ? (
                <li>
                  <a
                    href={`mailto:${company.email}`}
                    className="hover:text-foreground"
                  >
                    {company.email}
                  </a>
                </li>
              ) : null}
              {isFilled(company.officeAddress) ? (
                <li>{company.officeAddress}</li>
              ) : null}
              {isFilled(company.workingHours) ? (
                <li className="text-xs uppercase tracking-wider">
                  {company.workingHours}
                </li>
              ) : null}
            </ul>
          ) : (
            <div className="mt-3">
              <PlaceholderNotice
                variant="soft"
                title="Контакты появятся после публикации"
                description="Телефон, email и адрес офиса заполняются через административную панель компании. До этого момента публичные технические значения не отображаются."
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {company.brandFull}. Все права защищены.
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {FOOTER_LEGAL_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}