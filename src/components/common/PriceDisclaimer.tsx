interface PriceDisclaimerProps {
  className?: string;
}

export function PriceDisclaimer({ className }: PriceDisclaimerProps) {
  return (
    <div
      className={`rounded-md border border-border bg-muted p-4 text-sm leading-relaxed text-foreground ${className ?? ""}`}
    >
      Цены не являются публичной офертой.
    </div>
  );
}