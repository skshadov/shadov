import { ListBlock } from "./_ListBlock";

interface ServiceQualityControlProps { items: string[] }
export function ServiceQualityControl({ items }: ServiceQualityControlProps) {
  return <ListBlock title="Контроль качества" items={items} />;
}
