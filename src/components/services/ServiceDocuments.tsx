import { ListBlock } from "./_ListBlock";

interface ServiceDocumentsProps { items: string[] }
export function ServiceDocuments({ items }: ServiceDocumentsProps) {
  return <ListBlock title="Документы заказчика" items={items} />;
}
