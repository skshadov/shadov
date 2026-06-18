import { SectionHeading } from "@/components/common/SectionHeading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HOME_FAQ } from "@/data/faq-home";

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-24 border-b border-border bg-background">
      <div className="container-page py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <SectionHeading
            eyebrow="Вопросы и ответы"
            title="Что чаще всего спрашивают заказчики"
            description="Короткие честные ответы на ключевые вопросы. Полный список — на странице раздела FAQ."
          />
          <Accordion type="single" collapsible className="w-full">
            {HOME_FAQ.map((item, idx) => (
              <AccordionItem key={item.q} value={`faq-${idx}`}>
                <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}