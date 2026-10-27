import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { KaspiImage } from './kaspi/schema';
import type { GalleryImage } from './media-types';

/*
 * Фото по умолчанию отдаются с CDN Kaspi их собственными размерами (формат 3:4):
 * preview-medium 180w, preview-large 370w, gallery-medium 750w, gallery-large 1080w.
 * Главные фото расцветок зеркалятся при сборке (scripts/mirror-media.ts, решение Р2): если фото есть
 * в data/media-manifest.json и файл лежит в public/media, берём своё сжатое WebP из /media/.
 * Выключить зеркало - MIRROR_MEDIA=0. Меняется только сборка URL - компоненты не трогаем.
 */

type Manifest = Record<string, { file: string; widths: number[] }>;
let manifest: Manifest | null = null;

const fileChecked = new Map<string, boolean>();

function mirrored(img: KaspiImage): { file: string; widths: number[] } | null {
  if (process.env.MIRROR_MEDIA === '0') return null;
  if (!manifest) {
    const p = path.join(process.cwd(), 'data/media-manifest.json');
    manifest = existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as Manifest) : {};
  }
  const m = manifest[new URL(img.large).pathname];
  if (!m) return null;
  // Манифест без файлов (например, свежий клон без сборки) - не ссылаемся на несуществующие картинки.
  if (!fileChecked.has(m.file)) fileChecked.set(m.file, existsSync(path.join(process.cwd(), 'public/media', `${m.file}-750.webp`)));
  return fileChecked.get(m.file) ? m : null;
}

function withFormat(url: string, format: string): string {
  const u = new URL(url);
  u.searchParams.set('format', format);
  return u.toString();
}

function local(file: string, w: number): string {
  return `/media/${file}-${w}.webp`;
}

export function cardSrcSet(img: KaspiImage): { src: string; srcSet: string } {
  const m = mirrored(img);
  if (m) return { src: local(m.file, 370), srcSet: [180, 370, 750].map((w) => `${local(m.file, w)} ${w}w`).join(', ') };
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
  const m = mirrored(img);
  if (m) return { src: local(m.file, 750), srcSet: [370, 750, 1080].map((w) => `${local(m.file, w)} ${w}w`).join(', ') };
  return {
    src: img.medium,
    srcSet: [`${withFormat(img.medium, 'preview-large')} 370w`, `${img.medium} 750w`, `${img.large} 1080w`].join(', '),
  };
}

export function thumbSrc(img: KaspiImage): string {
  const m = mirrored(img);
  return m ? local(m.file, 180) : withFormat(img.medium, 'preview-medium');
}

export const KASPI_CDN = 'https://resources.cdn-kaspi.kz';

/** Фото галереи для клиентских компонентов: все URL готовы, файловая система не нужна. */
export function galleryImage(img: KaspiImage): GalleryImage {
  const m = mirrored(img);
  return { ...gallerySrcSet(img), thumb: thumbSrc(img), swatch: m ? local(m.file, 180) : img.small };
}
