import type { ServiceFaqItem } from "@/types/services";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ServiceFaqProps { items: ServiceFaqItem[] }
export function ServiceFaq({ items }: ServiceFaqProps) {
  if (items.length === 0) return null;
  return (
    <section className="border-b border-border py-10">
      <div className="container-page">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Частые вопросы</h2>
        <Accordion type="single" collapsible className="mt-6 rounded-lg border border-border bg-card">
          {items.map((q) => (
            <AccordionItem key={q.id} value={q.id} className="px-4">
              <AccordionTrigger className="text-left text-sm font-semibold">{q.question}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{q.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
