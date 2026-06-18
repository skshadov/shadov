import { ListBlock } from "./_ListBlock";

interface ServiceApplicationsProps { items: string[] }
export function ServiceApplications({ items }: ServiceApplicationsProps) {
  return <ListBlock title="Для каких объектов подходит" items={items} />;
}
