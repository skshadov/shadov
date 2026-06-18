import { ListBlock } from "./_ListBlock";

interface ServiceBenefitsProps { items: string[] }
export function ServiceBenefits({ items }: ServiceBenefitsProps) {
  return <ListBlock title="Преимущества" items={items} />;
}
