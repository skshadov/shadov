import { ListBlock } from "./_ListBlock";
interface ServiceStagesProps { items: string[] }
export function ServiceStages({ items }: ServiceStagesProps) {
  return <ListBlock title="Этапы работ" items={items} ordered />;
}
