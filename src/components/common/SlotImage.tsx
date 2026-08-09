/**
 * Фотография с возможностью замены через админку («Фото сайта»).
 * Если для слота загружено своё изображение — показывается оно,
 * иначе используется исходная иллюстрация проекта.
 */
import { Illustration, type IllustrationSource } from "@/components/common/Illustration";
import { useSiteImageUrl } from "@/lib/site-content/store";

export interface PictureBundle {
  src: string;
  width: number;
  height: number;
  sources: IllustrationSource[];
  imgSrcSet?: string;
  imgSizes?: string;
}

interface Props {
  slotKey: string;
  picture: PictureBundle;
  description: string;
  imgClassName?: string;
  className?: string;
}

export function SlotImage({ slotKey, picture, description, imgClassName, className }: Props) {
  const override = useSiteImageUrl(slotKey);

  if (override) {
    return (
      <img
        src={override}
        alt={description}
        width={picture.width}
        height={picture.height}
        loading="lazy"
        decoding="async"
        className={imgClassName}
      />
    );
  }

  return (
    <Illustration
      src={picture.src}
      sources={picture.sources}
      imgSrcSet={picture.imgSrcSet}
      imgSizes={picture.imgSizes}
      description={description}
      width={picture.width}
      height={picture.height}
      imgClassName={imgClassName}
      className={className}
      rounded={false}
    />
  );
}