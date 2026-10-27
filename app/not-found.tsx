import type { Metadata } from 'next';
import Link from 'next/link';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('notFound.h1') };

export default function NotFound() {
  return (
    <div className="container-page max-w-2xl py-20 text-center">
      <p aria-hidden="true" className="font-display text-7xl font-semibold text-ink-3">404</p>
      <h1 className="mt-4 text-3xl">{t('notFound.h1')}</h1>
      <p className="mt-3 text-ink-2">{t('notFound.text')}</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="btn btn-secondary">
          {t('notFound.toHome')}
        </Link>
        <Link href="/podbor" className="btn btn-primary">
          {t('home.ctaPodbor')}
        </Link>
      </div>
    </div>
  );
}
