import type { Metadata } from 'next';
import { flags } from './flags';

/*
 * canonical для страницы и, когда включён FEATURE_KK, hreflang ru-KZ / kk-KZ / x-default.
 * Русский - без префикса, казахский - /kk/... (маршруты /kk появятся вместе с переводом).
 */
export function alternatesFor(path: string): Metadata['alternates'] {
  if (!flags.kk) return { canonical: path };
  const kk = path === '/' ? '/kk' : `/kk${path}`;
  return { canonical: path, languages: { 'ru-KZ': path, 'kk-KZ': kk, 'x-default': path } };
}
