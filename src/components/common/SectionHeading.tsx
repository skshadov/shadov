import type { ReactNode } from "react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  as?: "h2" | "h3";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Tag = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <header
      className={`flex flex-col gap-3 ${align === "center" ? "items-center text-center" : ""} ${className ?? ""}`}
    >
      {eyebrow ? (
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          {eyebrow}
        </span>
      ) : null}
      <Tag className="font-display text-3xl font-semibold leading-tight text-balance sm:text-4xl md:text-[44px]">
        {title}
      </Tag>
      {description ? (
        <p
          className={`max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg ${align === "center" ? "mx-auto" : ""}`}
        >
          {description}
        </p>
      ) : null}
    </header>
  );
}