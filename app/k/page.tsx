import type { Metadata } from 'next';
import Link from 'next/link';
import { getGuides } from '@/lib/guides';
import { t } from '@/lib/i18n';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: { absolute: `${t('meta.guidesTitle')}${t('meta.titleSuffix')}` },
  description: t('meta.guidesDescription'),
  alternates: { canonical: '/k' },
};

export default function GuidesIndex() {
  const guides = getGuides();
  return (
    <div className="container-page pt-4">
      <Breadcrumbs items={[{ name: t('nav.guides'), href: '/k' }]} />
      <h1 className="mt-4 text-[2rem] md:text-[2.75rem]">{t('guides.h1')}</h1>
      <p className="mt-2 max-w-2xl text-lg text-ink-2">{t('guides.lead')}</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link href={`/k/${g.slug}`} className="flex h-full flex-col gap-3 rounded-[var(--radius-card)] bg-surface p-6 shadow-[var(--shadow-card)] hover:shadow-md">
              <span className="font-display text-xl font-semibold">{g.h1}</span>
              <span className="text-ink-2">{g.description}</span>
              <span className="mt-auto text-sm font-semibold text-accent">{t('guides.read')} →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
