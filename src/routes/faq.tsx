import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout, InfoSection, buildInfoHead } from "@/components/info/InfoPageLayout";
import { HOME_FAQ } from "@/data/faq-home";

const PATH = "/faq";
const TITLE = "Вопросы и ответы — Шадов и партнёры";
const DESC = "Частые вопросы по договору, поэтапной оплате, контролю качества, материалам и сдаче объекта.";

export const Route = createFileRoute("/faq")({
  head: () => ({
    ...buildInfoHead({
      title: TITLE, description: DESC, path: PATH,
      breadcrumbs: [
        { name: "Главная", path: "/" },
        { name: "Вопросы и ответы", path: PATH },
      ],
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: HOME_FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <InfoPageLayout
      breadcrumbs={[{ label: "Главная", to: "/" }, { label: "Вопросы и ответы" }]}
      h1="Вопросы и ответы"
      intro={<p>Самые частые вопросы по договору, оплате, контролю качества и сдаче объекта.</p>}
    >
      <InfoSection>
        <dl className="space-y-6">
          {HOME_FAQ.map((f) => (
            <div key={f.q}>
              <dt className="font-display text-lg font-semibold text-foreground">{f.q}</dt>
              <dd className="mt-2 text-base leading-relaxed text-foreground/90">{f.a}</dd>
            </div>
          ))}
        </dl>
      </InfoSection>
    </InfoPageLayout>
  );
}
