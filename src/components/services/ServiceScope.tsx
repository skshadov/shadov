import { ListBlock } from "./_ListBlock";

interface ServiceScopeProps { items: string[] }
export function ServiceScope({ items }: ServiceScopeProps) {
  return <ListBlock title="Что входит" items={items} />;
}
