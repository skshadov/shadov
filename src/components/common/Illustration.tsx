/**
 * Обёртка над AI-сгенерированной иллюстрацией.
 * Уточнение 3 пользователя: каждое AI-изображение должно иметь
 * is_ai_generated=true, видимую подпись «Иллюстрация», alt с тем
 * же словом. Запрещено использовать в портфолио/карточках
 * объектов/рядом с адресом/стоимостью/отзывом.
 */
import type { ImgHTMLAttributes } from "react";

type BaseImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "loading">;

interface IllustrationProps extends BaseImgProps {
  src: string;
  /** Конец фразы после слова «Иллюстрация:» — описывает изображение. */
  description: string;
  width: number;
  height: number;
  priority?: boolean;
  caption?: boolean;
  rounded?: boolean;
  imgClassName?: string;
}

export function Illustration({
  src,
  description,
  width,
  height,
  priority = false,
  caption = true,
  rounded = true,
  className,
  imgClassName,
  ...rest
}: IllustrationProps) {
  const alt = `Иллюстрация: ${description}`;
  return (
    <figure
      className={`relative ${className ?? ""}`}
      data-is-ai-generated="true"
    >
      <img
        {...rest}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        // @ts-expect-error — fetchpriority валидный HTML-атрибут
        fetchpriority={priority ? "high" : undefined}
        className={`block w-full h-auto ${rounded ? "rounded-lg" : ""} ${imgClassName ?? ""}`}
        style={{ aspectRatio: `${width} / ${height}` }}
      />
      {caption ? (
        <figcaption className="pointer-events-none absolute right-2 bottom-2 rounded-sm bg-black/55 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/90 backdrop-blur-sm">
          Иллюстрация
        </figcaption>
      ) : null}
    </figure>
  );
}