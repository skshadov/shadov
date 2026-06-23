import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";
import { PlaceholderNotice } from "@/components/common/PlaceholderNotice";
import { company, isFilled } from "@/config/company";

const PATH = "/sro-i-dokumenty";
const TITLE = "СРО и документы — Шадов и партнёры";
const DESC = "Сведения о допусках СРО и сопровождающих документах. Реквизиты публикуются после заполнения и проверки.";

export const Route = createFileRoute("/sro-i-dokumenty")({
  head: () => buildInfoHead({
    title: TITLE, description: DESC, path: PATH,
    breadcrumbs: [
      { name: "Главная", path: "/" },
      { name: "О компании", path: "/about" },
      { name: "СРО и документы", path: PATH },
    ],
  }),
  component: Page,
});

function Page() {
  const hasSro = isFilled(company.sroName) || isFilled(company.sroNumber);
  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "О компании", to: "/about" }, { label: "СРО и документы" }]}
      h1="СРО и документы"
      intro={<p>По запросу мы предоставим актуальную выписку из реестра СРО и подтверждающие документы напрямую.</p>}
    >
      <InfoSection title="Сведения о допуске СРО">
        {hasSro ? (
          <ul className="space-y-2">
            {isFilled(company.sroName) ? <li>Организация: {company.sroName}</li> : null}
            {isFilled(company.sroNumber) ? <li>Номер записи в реестре: {company.sroNumber}</li> : null}
            {isFilled(company.sroRegistryUrl) ? (
              <li>
                <a href={company.sroRegistryUrl} className="text-primary underline underline-offset-2 hover:opacity-80" rel="noreferrer noopener" target="_blank">
                  Запись в реестре
                </a>
              </li>
            ) : null}
          </ul>
        ) : (
          <PlaceholderNotice
            title="Сведения СРО публикуются после заполнения реквизитов"
            description="Документы и подтверждающие сведения публикуются после заполнения реквизитов компании. Актуальные документы предоставляются по запросу."
          />
        )}
      </InfoSection>
      <InfoSection title="Документы, передаваемые заказчику">
        <ul className="list-disc space-y-2 pl-5">
          <li>Договор подряда с приложениями</li>
          <li>Согласованная смета и план-график</li>
          <li>Акты выполненных работ по этапам</li>
          <li>Акты скрытых работ с фотофиксацией</li>
          <li>Исполнительная документация и сопроводительные документы по материалам</li>
        </ul>
      </InfoSection>
    </InfoPageLayout>
  );
}
