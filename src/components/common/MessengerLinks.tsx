/**
 * Иконки прямого перехода в мессенджеры на номер компании.
 * WhatsApp, Telegram, MAX. Скрывается, если ни одна ссылка не заполнена.
 */
import { company, isFilled } from "@/config/company";

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M19.05 4.91A10 10 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.78 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.02zM12.04 20.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.19-.31a8.21 8.21 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.83 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.25 8.24zm4.52-6.17c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.13-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42-.14-.01-.31-.01-.48-.01a.92.92 0 0 0-.67.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.02 2.57.13.17 1.75 2.67 4.24 3.74.59.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29z" />
    </svg>
  );
}

function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.94 4.34c-.22-.18-.55-.21-.81-.1L2.66 11.7c-.31.13-.51.43-.5.77.01.34.23.63.55.74l4.55 1.5 1.78 5.65c.05.16.15.3.29.4.04.03.09.05.13.07.1.04.21.06.32.06.13 0 .26-.03.38-.09.1-.05.18-.13.25-.22l2.59-3.18 4.45 3.28c.14.1.31.16.49.16.08 0 .17-.01.25-.04.25-.07.45-.27.52-.52l3.45-15.05c.07-.27-.02-.55-.22-.73zM9.5 14.34l-.55 3.45-1.13-3.58 8.79-5.5L9.5 14.34zm.8 4.49.31-1.94 1.6 1.18-1.91.76zm8.46.43-4.13-3.04-1.34-.99 6.74-7.6-1.27 11.63z" />
    </svg>
  );
}

function MaxIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    // Официальный знак мессенджера MAX (max.ru). Фирменный градиент задан
    // через SVG linearGradient вместо foreignObject из исходника — это
    // надёжно работает во всех браузерах и при ретина-рендеринге.
    <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="max-brand-gradient" x1="6" y1="4" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#06AFFB" />
          <stop offset="0.55" stopColor="#001CF1" />
          <stop offset="1" stopColor="#8900AC" />
        </linearGradient>
      </defs>
      <path
        fill="url(#max-brand-gradient)"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.39 41.89c-3.93 0-5.75-.58-8.9-2.9-2.02 2.61-8.34 4.63-8.62 1.17 0-2.6-.58-4.8-1.22-7.2C2.87 30 2 26.72 2 21.94 2 10.56 11.28 2 22.28 2c11 0 19.63 8.98 19.63 20.06 0 11.07-8.9 19.83-19.52 19.83Zm.2-30.02c-5.22-.27-9.3 3.37-10.2 9.08-.74 4.72.58 10.48 1.7 10.77.54.13 1.9-.98 2.74-1.82 1.39.9 2.97 1.6 4.73 1.7a9.96 9.96 0 0 0 10.4-9.34 10 10 0 0 0-9.37-10.39Z"
      />
    </svg>
  );
}

interface MessengerLinksProps {
  variant?: "default" | "compact";
  className?: string;
}

export function MessengerLinks({ variant = "default", className }: MessengerLinksProps) {
  const links: { label: string; href: string; Icon: typeof WhatsAppIcon; color: string }[] = [];
  if (isFilled(company.whatsapp)) {
    links.push({ label: "WhatsApp", href: company.whatsapp, Icon: WhatsAppIcon, color: "#25D366" });
  }
  if (isFilled(company.telegram)) {
    links.push({ label: "Telegram", href: company.telegram, Icon: TelegramIcon, color: "#229ED9" });
  }
  if (isFilled((company as { max?: string }).max)) {
    // Для MAX используем прозрачный контейнер — фирменный знак уже содержит
    // собственный градиент и должен показываться в оригинальном виде.
    links.push({ label: "MAX", href: (company as { max: string }).max, Icon: MaxIcon, color: "transparent" });
  }
  if (links.length === 0) return null;

  const size = variant === "compact" ? "h-9 w-9" : "h-11 w-11";
  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {links.map(({ label, href, Icon, color }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Написать в ${label}`}
            title={`Написать в ${label}`}
            style={label === "MAX" ? undefined : { backgroundColor: color }}
            className={`inline-flex ${size} items-center justify-center rounded-full ${label === "MAX" ? "" : "text-white shadow-sm"} transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
          >
            <Icon className={label === "MAX" ? (variant === "compact" ? "h-9 w-9" : "h-11 w-11") : (variant === "compact" ? "h-4 w-4" : "h-5 w-5")} />
          </a>
        </li>
      ))}
    </ul>
  );
}