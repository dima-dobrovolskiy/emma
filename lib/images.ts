import type { KaspiImage } from './kaspi/schema';

/*
 * Фото отдаются с CDN Kaspi их собственными размерами (формат 3:4):
 * preview-small 135w, preview-medium 180w, preview-large 370w, gallery-medium 750w, gallery-large 1080w.
 * Если включим зеркалирование (scripts/mirror-media.ts), здесь меняется только сборка URL.
 */

function withFormat(url: string, format: string): string {
  const u = new URL(url);
  u.searchParams.set('format', format);
  return u.toString();
}

export function cardSrcSet(img: KaspiImage): { src: string; srcSet: string } {
  return {
    src: withFormat(img.medium, 'preview-large'),
    srcSet: [
      `${withFormat(img.medium, 'preview-medium')} 180w`,
      `${withFormat(img.medium, 'preview-large')} 370w`,
      `${img.medium} 750w`,
    ].join(', '),
  };
}

export function gallerySrcSet(img: KaspiImage): { src: string; srcSet: string } {
  return {
    src: img.medium,
    srcSet: [`${withFormat(img.medium, 'preview-large')} 370w`, `${img.medium} 750w`, `${img.large} 1080w`].join(', '),
  };
}

export function thumbSrc(img: KaspiImage): string {
  return withFormat(img.medium, 'preview-medium');
}

export const KASPI_CDN = 'https://resources.cdn-kaspi.kz';

/** Лёгкая версия для первого показа главного фото. */
export function lowSrc(img: KaspiImage): string {
  return withFormat(img.medium, 'preview-large');
}
