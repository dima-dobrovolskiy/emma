import type { Metadata } from 'next';
import { flags } from './flags';
import { getCatalog, getModel } from './catalog';
import { t } from './i18n';
import { shareImage } from './images';
import { absUrl } from './site';
import homeContent from '@/content/ru/home.json';
import type { KaspiImage } from './kaspi/schema';

/**
 * Open Graph и Twitter для страницы целиком: Next.js не сливает openGraph страницы с layout, а заменяет,
 * поэтому имя сайта, локаль, тип и картинку задаём здесь для каждой страницы. Без своей картинки -
 * обложка модели с главной.
 */
export function socialMeta({
  title,
  description,
  path,
  image,
  type = 'website',
}: {
  title: string;
  description: string;
  path: string;
  image?: KaspiImage;
  type?: 'website' | 'article';
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  const fallback = (getModel(homeContent.heroModel) ?? getCatalog().models[0])?.defaultVariant.images[0];
  const img = image ?? fallback;
  const share = img ? shareImage(img) : null;
  const images = share ? [{ url: share.url, width: share.width, height: share.height, alt: title }] : [];
  return {
    openGraph: { title, description, url: absUrl(path), siteName: t('meta.siteName'), locale: t('meta.locale'), type, images },
    twitter: { card: 'summary_large_image', title, description, images: images.map((i) => i.url) },
  };
}

/*
 * canonical для страницы и, когда включён FEATURE_KK, hreflang ru-KZ / kk-KZ / x-default.
 * Русский - без префикса, казахский - /kk/... (маршруты /kk появятся вместе с переводом).
 */
export function alternatesFor(path: string): Metadata['alternates'] {
  if (!flags.kk) return { canonical: path };
  const kk = path === '/' ? '/kk' : `/kk${path}`;
  return { canonical: path, languages: { 'ru-KZ': path, 'kk-KZ': kk, 'x-default': path } };
}
