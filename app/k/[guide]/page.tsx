import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import { getCatalog } from '@/lib/catalog';
import { getGuides, getGuideSource } from '@/lib/guides';
import { guideModels } from '@/lib/guide-data';
import { formatDate, formatPrice, t } from '@/lib/i18n';
import { categorySummary, fmtRating } from '@/lib/summary';
import { absUrl } from '@/lib/site';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Faq } from '@/components/ui/Faq';
import { JsonLd } from '@/components/ui/JsonLd';
import { Short } from '@/components/ui/Short';
import { CompareTable, GuideModels, ReviewQuotes, WhatToBuy } from '@/components/guide/GuideBlocks';

type Params = { params: Promise<{ guide: string }> };

export function generateStaticParams() {
  return getGuides().map((g) => ({ guide: g.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { guide } = await params;
  const src = getGuideSource(guide);
  if (!src) return {};
  return {
    title: src.meta.title,
    description: src.meta.description,
    alternates: { canonical: `/k/${guide}` },
    openGraph: { title: src.meta.title, description: src.meta.description, url: absUrl(`/k/${guide}`), type: 'article' },
  };
}

export default async function GuidePage({ params }: Params) {
  const { guide } = await params;
  const src = getGuideSource(guide);
  if (!src) notFound();
  const { meta, body } = src;
  const models = guideModels(meta.models);
  const { pricesDate } = getCatalog();
  const reviews = models.reduce((s, m) => s + m.reviewsCount, 0);
  const ratings = models.reduce((s, m) => s + m.ratingCount, 0);
  const avg = ratings ? models.reduce((s, m) => s + (m.ratingAvg ?? 0) * m.ratingCount, 0) / ratings : null;
  const summary = categorySummary({ name: meta.h1, models });

  const { content } = await compileMDX({
    source: body,
    components: {
      WhatToBuy: () => <WhatToBuy models={models} guide={guide} />,
      CompareTable: () => <CompareTable models={models} guide={guide} date={pricesDate} />,
      ReviewQuotes: () => <ReviewQuotes models={models} />,
      GuideModels: () => <GuideModels models={models} guide={guide} />,
    },
  });

  return (
    <article className="container-page pt-4">
      <Breadcrumbs items={[{ name: t('nav.guides'), href: '/k' }, { name: meta.h1, href: `/k/${guide}` }]} />
      <header className="mt-4 max-w-3xl">
        <h1 className="text-[2rem] leading-tight md:text-[2.75rem]">{meta.h1}</h1>
        <p className="mt-3 text-ink-2">
          {t('guides.summaryLine', {
            models: t('common.modelsCount', { count: models.length }),
            min: formatPrice(Math.min(...models.map((m) => m.minPrice))),
            max: formatPrice(Math.max(...models.map((m) => m.maxPrice))),
            reviews: t('common.reviewsCount', { count: reviews }),
            rating: avg !== null ? fmtRating(avg) : '-',
          })}
        </p>
      </header>
      <div className="mt-6 max-w-3xl">
        <Short text={summary} date={t('guides.updated', { date: formatDate(pricesDate) })} />
      </div>
      <div className="prose-se mt-8 max-w-3xl [&_.not-prose]:max-w-none">{content}</div>
      <div className="max-w-3xl">
        <Faq items={meta.faq} />
      </div>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: meta.h1,
          itemListElement: models.map((m, i) => ({ '@type': 'ListItem', position: i + 1, url: absUrl(`/p/${m.slug}`), name: m.name })),
        }}
      />
    </article>
  );
}
