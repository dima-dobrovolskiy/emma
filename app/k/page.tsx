import type { Metadata } from 'next';
import Link from 'next/link';
import { getGuides } from '@/lib/guides';
import { alternatesFor } from '@/lib/seo';
import { t } from '@/lib/i18n';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: { absolute: `${t('meta.guidesTitle')}${t('meta.titleSuffix')}` },
  description: t('meta.guidesDescription'),
  alternates: alternatesFor('/k'),
};

export default function GuidesIndex() {
  const guides = getGuides();
  return (
    <div className="container-page pt-4">
      <Breadcrumbs items={[{ name: t('nav.guides'), href: '/k' }]} />
      <h1 className="h-page mt-4">{t('guides.h1')}</h1>
      <p className="mt-2 max-w-2xl text-lg text-ink-2">{t('guides.lead')}</p>
      <ul className="mt-10 grid md:grid-cols-3 md:gap-x-8">
        {guides.map((g) => (
          <li key={g.slug} className="border-t border-line">
            <Link href={`/k/${g.slug}`} className="group flex h-full flex-col gap-3 py-6">
              <span className="font-display text-2xl leading-snug group-hover:underline group-hover:underline-offset-4">{g.h1}</span>
              <span className="text-ink-2">{g.description}</span>
              <span className="mt-auto text-sm font-semibold text-accent">
                {t('guides.read')} <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
