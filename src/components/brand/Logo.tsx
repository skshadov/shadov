/**
 * Временный SVG-логотип «Шадов и партнёры» (§9 ТЗ).
 * Без крыш, домов, кранов, молотков, касок, кирпичей и готовых
 * иконок из библиотек — только типографическая марка.
 * После загрузки утверждённого логотипа заменяется через
 * административную панель.
 */
import { Link } from "@tanstack/react-router";

interface LogoProps {
  variant?: "full" | "compact";
  className?: string;
  asLink?: boolean;
  ariaLabel?: string;
}

export function Logo({
  variant = "full",
  className,
  asLink = true,
  ariaLabel = "Шадов и партнёры — на главную",
}: LogoProps) {
  const content = variant === "compact" ? <LogoCompact /> : <LogoFull />;
  if (!asLink) {
    return (
      <span
        className={className}
        role="img"
        aria-label={ariaLabel}
        data-temporary-logo="true"
      >
        {content}
      </span>
    );
  }
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-3 focus-visible:outline-none ${className ?? ""}`}
      aria-label={ariaLabel}
      data-temporary-logo="true"
    >
      {content}
    </Link>
  );
}

function LogoMark() {
  // Геометрическая марка: пара пересекающихся линий — символ
  // «прямого договора и партнёрства». Никаких крыш/касок/кирпичей.
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="0.5" y="0.5" width="39" height="39" rx="6" fill="none" stroke="currentColor" strokeOpacity="0.45" />
      <path
        d="M9 30 L20 10 L31 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M14 30 L20 19 L26 30"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function LogoFull() {
  return (
    <>
      <LogoMark />
      <span className="flex flex-col leading-tight">
        <span className="font-display text-[15px] font-semibold tracking-[0.14em] uppercase">
          Шадов&nbsp;и&nbsp;партнёры
        </span>
        <span className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
          Строительная компания
        </span>
      </span>
    </>
  );
}

function LogoCompact() {
  return (
    <>
      <LogoMark />
      <span className="font-display text-base font-semibold tracking-[0.18em] uppercase">
        SHADOV.PRO
      </span>
    </>
  );
}