'use client';

import { usePageLoaded } from '@/lib/hooks';

/**
 * Картинка, которая начинает грузиться только после загрузки страницы: мелкие фото ниже первого экрана
 * (кружки расцветок, фото из отзывов) иначе делят канал с главным фото и отодвигают LCP на телефоне.
 * До загрузки место держит родитель (у него размер и фон).
 */
export function AfterLoadImg({ alt, ...rest }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) {
  const loaded = usePageLoaded();
  return loaded ? <img alt={alt} loading="lazy" decoding="async" {...rest} /> : null;
}
