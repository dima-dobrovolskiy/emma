import type { Metadata } from 'next';
import Link from 'next/link';
import { getGuides } from '@/lib/guides';
import { alternatesFor, socialMeta } from '@/lib/seo';
import { t } from '@/lib/i18n';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: { absolute: `${t('meta.guidesTitle')}${t('meta.titleSuffix')}` },
  description: t('meta.guidesDescription'),
  alternates: alternatesFor('/k'),
  ...socialMeta({ title: `${t('meta.guidesTitle')}${t('meta.titleSuffix')}`, description: t('meta.guidesDescription'), path: '/k' }),
};

export default function GuidesIndex() {
  const guides = getGuides();
  return (
    <div className="container-page pt-4">
      <Breadcrumbs items={[{ name: t('nav.guides'), href: '/k' }]} />
      <h1 className="h-page mt-4">{t('guides.h1')}</h1>
      <p className="mt-2 max-w-2xl text-lg text-ink-2">{t('guides.lead')}</p>
      <ul className="mt-10 grid gap-3 md:grid-cols-3 md:gap-5">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link href={`/k/${g.slug}`} className="plate group">
              <span className="font-display text-2xl leading-snug">{g.h1}</span>
              <span className="text-ink-2">{g.description}</span>
              <span className="text-sm font-semibold text-accent">
                {t('guides.read')} <span aria-hidden="true" className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
