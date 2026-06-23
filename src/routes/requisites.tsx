import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";
import { PlaceholderNotice } from "@/components/common/PlaceholderNotice";
import { company, isFilled } from "@/config/company";
import { getPublicCompanyRequisites } from "@/lib/admin/settings.functions";

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
  loader: async () => {
    const data = await getPublicCompanyRequisites().catch(() => null);
    return { remote: data };
  },
  component: Page,
});

function Page() {
  const { remote } = Route.useLoaderData();
  const fields: { label: string; value: string }[] = [];
  const pairs: Array<readonly [string, string | undefined | null]> = [
    ["Полное наименование", remote?.legal_name ?? company.legalName],
    ["Бренд", remote?.brand_name ?? company.brandName],
    ["ИНН", remote?.inn ?? company.inn],
    ["КПП", remote?.kpp ?? company.kpp],
    ["ОГРН", remote?.ogrn ?? company.ogrn],
    ["Юридический адрес", remote?.legal_address ?? company.legalAddress],
    ["Адрес офиса", remote?.office_address ?? company.officeAddress],
    ["Телефон", remote?.phone ?? company.phone],
    ["Email", remote?.email ?? company.email],
    ["СРО", remote?.sro_name ?? ""],
    ["Номер СРО", remote?.sro_number ?? ""],
    ["Реестр СРО", remote?.sro_registry_url ?? ""],
    ["Банк", remote?.bank_name ?? ""],
    ["БИК", remote?.bank_bik ?? ""],
    ["Расчётный счёт", remote?.bank_account ?? ""],
    ["Корр. счёт", remote?.bank_corr_account ?? ""],
  ];
  for (const [label, value] of pairs) {
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
