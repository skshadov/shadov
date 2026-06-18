import { ListBlock } from "./_ListBlock";
interface ServiceExclusionsProps { items: string[] }
export function ServiceExclusions({ items }: ServiceExclusionsProps) {
  return <ListBlock title="Что не входит" items={items} variant="negative" />;
}
