/**
 * Аккуратный честный плейсхолдер вместо вымышленных кейсов/отзывов
 * /команды/документов (уточнения 3–4 пользователя).
 */
import type { ReactNode } from "react";
import { Info } from "lucide-react";

interface PlaceholderNoticeProps {
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "default" | "soft";
}

export function PlaceholderNotice({
  title,
  description,
  action,
  variant = "default",
}: PlaceholderNoticeProps) {
  const isSoft = variant === "soft";
  return (
    <div
      role="status"
      className={`flex flex-col items-start gap-3 rounded-lg border px-5 py-6 sm:flex-row sm:items-center sm:gap-4 ${
        isSoft
          ? "border-border/60 bg-muted/40"
          : "border-dashed border-border bg-card/40"
      }`}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Info aria-hidden="true" className="h-4 w-4" />
      </span>
      <div className="flex-1">
        <p className="font-display text-base font-semibold leading-tight">{title}</p>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}