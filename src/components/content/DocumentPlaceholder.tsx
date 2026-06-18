/**
 * Подэтап 2.1 — карточка документа без подтверждённых данных (§17 запроса).
 */
import { FileText } from "lucide-react";

interface DocumentPlaceholderProps {
  title: string;
  description?: string;
}

export function DocumentPlaceholder({ title, description }: DocumentPlaceholderProps) {
  return (
    <article className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-card p-4">
      <FileText aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        <p className="mt-2 text-xs italic text-muted-foreground">Заполняется через административную панель</p>
      </div>
    </article>
  );
}
