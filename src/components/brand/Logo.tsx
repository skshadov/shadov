/**
 * Временный SVG-логотип «Шадов и партнёры» (§9 ТЗ).
 * Без крыш, домов, кранов, молотков, касок, кирпичей и готовых
 * иконок из библиотек — только типографическая марка.
 * После загрузки утверждённого логотипа заменяется через
 * административную панель.
 */
import { Link } from "@tanstack/react-router";
import logoSrc from "@/assets/brand/shadov-logo.png";

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
  return (
    <img
      src={logoSrc}
      alt=""
      aria-hidden="true"
      className="h-10 w-10 shrink-0 object-contain"
      width={40}
      height={40}
    />
  );
}

function LogoFull() {
  return (
    <>
      <LogoMark />
      <span className="flex flex-col leading-tight whitespace-nowrap">
        <span className="font-display text-[11px] sm:text-[13px] lg:text-[15px] font-semibold tracking-[0.14em] uppercase">
          Шадов&nbsp;и&nbsp;партнёры
        </span>
        <span
          data-logo-subtitle
          className="text-[7px] sm:text-[8px] lg:text-[9px] tracking-[0.2em] uppercase text-muted-foreground"
        >
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
      <span className="flex flex-col leading-tight whitespace-nowrap">
        <span className="font-display text-[13px] font-semibold tracking-[0.14em] uppercase">
          Шадов&nbsp;и&nbsp;партнёры
        </span>
        <span className="text-[8px] tracking-[0.2em] uppercase text-muted-foreground">
          Строительная компания
        </span>
      </span>
    </>
  );
}