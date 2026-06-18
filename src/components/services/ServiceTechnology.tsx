import { ListBlock } from "./_ListBlock";

interface ServiceTechnologyProps { items: string[] }
export function ServiceTechnology({ items }: ServiceTechnologyProps) {
  return <ListBlock title="Используемая технология" items={items} />;
}
