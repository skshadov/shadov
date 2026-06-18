import { ListBlock } from "./_ListBlock";
interface ServiceTimelineProps { items: string[] }
export function ServiceTimeline({ items }: ServiceTimelineProps) {
  return <ListBlock title="Сроки и факторы, влияющие на длительность" items={items} />;
}
