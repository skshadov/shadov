import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";
import { PlaceholderNotice } from "@/components/common/PlaceholderNotice";
import { company, isFilled } from "@/config/company";

const PATH = "/requisites";
const TITLE = "Реквизиты — Шадов и партнёры";
const DESC = "Реквизиты компании. Сведения публикуются после заполнения и проверки данных.";

export const Route = createFileRoute("/requisites")({
  head: () => buildInfoHead({
    title: TITLE, description: DESC, path: PATH,
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "Реквизиты", path: PATH },
    ],
  }),
  component: Page,
});

function Page() {
  const fields: { label: string; value: string }[] = [];
  for (const [label, value] of [
    ["Полное наименование", company.legalName],
    ["Бренд", company.brandName],
    ["ИНН", company.inn],
    ["КПП", company.kpp],
    ["ОГРН", company.ogrn],
    ["Юридический адрес", company.legalAddress],
    ["Адрес офиса", company.officeAddress],
    ["Телефон", company.phone],
    ["Email", company.email],
  ] as const) {
    if (isFilled(value)) fields.push({ label, value });
  }

  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Реквизиты" }]}
      h1="Реквизиты"
    >
      <InfoSection title="Сведения о компании">
        {fields.length > 0 ? (
          <dl className="grid gap-3 md:grid-cols-2">
            {fields.map((f) => (
              <div key={f.label}>
                <dt className="text-sm text-muted-foreground">{f.label}</dt>
                <dd className="font-medium text-foreground">{f.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <PlaceholderNotice
            title="Реквизиты компании будут опубликованы после заполнения и проверки данных"
            description="Вымышленные ИНН, ОГРН, адрес и расчётный счёт не используются. Реквизиты публикуются через административную панель после подтверждения сведений."
          />
        )}
      </InfoSection>
    </InfoPageLayout>
  );
}
