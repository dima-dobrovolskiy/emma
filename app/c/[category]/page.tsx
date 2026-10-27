import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalog, type Category, type Collection } from '@/lib/catalog';
import { getGuideMeta } from '@/lib/guides';
import { formatDate, formatPrice, t } from '@/lib/i18n';
import { alternatesFor } from '@/lib/seo';
import { absUrl } from '@/lib/site';
import { categorySummary, creditText } from '@/lib/summary';
import { listingFacets } from '@/lib/facets';
import { ModelCard } from '@/components/product/ModelCard';
import { CategoryListing } from '@/components/category/CategoryListing';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Faq } from '@/components/ui/Faq';
import { JsonLd } from '@/components/ui/JsonLd';
import { Short } from '@/components/ui/Short';

type Params = { params: Promise<{ category: string }> };

function findPage(slug: string): Category | Collection | undefined {
  const { categories, collections } = getCatalog();
  return categories.find((c) => c.slug === slug && c.models.length > 0) ?? collections.find((c) => c.slug === slug);
}

export function generateStaticParams() {
  const { categories, collections } = getCatalog();
  return [...categories.filter((c) => c.models.length), ...collections].map((c) => ({ category: c.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  const c = findPage(category);
  if (!c) return {};
  const minPrice = Math.min(...c.models.map((m) => m.minPrice));
  const reviews = c.models.reduce((s, m) => s + m.reviewsCount, 0);
  const title = c.seo.title ?? t('meta.categoryTitle', { name: c.name, price: formatPrice(minPrice), reviews: t('common.reviewsCount', { count: reviews }) });
  const description =
    c.seo.description ??
    t('meta.categoryDescription', {
      name: c.name,
      models: t('common.modelsCount', { count: c.models.length }),
      price: formatPrice(minPrice),
      reviews: t('common.reviewsCount', { count: reviews }),
    });
  return {
    title: { absolute: `${title}${t('meta.titleSuffix')}` },
    description,
    alternates: alternatesFor(`/c/${c.slug}`),
    openGraph: { title, description, url: absUrl(`/c/${c.slug}`) },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { category } = await params;
  const c = findPage(category);
  if (!c) notFound();
  const { lines, pricesDate, categories, collections } = getCatalog();
  const models = c.models;
  const inStock = models.filter((m) => m.inStockCount > 0).length;
  const credit = models[0] ? creditText(models[0]) : null;
  const faq = c.faq.map((f) => ({ q: f.q, a: f.a.replace('{credit}', credit ?? '-') }));
  const guides = c.guides.map((g) => getGuideMeta(g)).filter((g): g is NonNullable<typeof g> => Boolean(g));
  const ageLabels = Object.fromEntries(lines.podbor.ages.map((a) => [a.id, t(`age.${a.id}` as 'age.0-3')]));
  const others = [...categories.filter((x) => x.models.length), ...collections].filter((x) => x.slug !== c.slug);

  return (
    <div className="container-page pt-4">
      <Breadcrumbs items={[{ name: c.nameShort, href: `/c/${c.slug}` }]} />
      <header className="mt-4 max-w-3xl">
        <h1 className="text-[2rem] leading-tight md:text-[2.75rem]">{c.name}</h1>
        <p className="mt-2 text-ink-2">{c.intro}</p>
        <p className="mt-2 text-sm text-ink-3">{t('category.modelsInStock', { models: t('common.modelsCount', { count: inStock }) })}</p>
      </header>
      <div className="mt-6 max-w-3xl">
        <Short text={categorySummary(c)} date={t('common.pricesActual', { date: formatDate(pricesDate) })} />
      </div>

      <div className="mt-8">
        <CategoryListing
          page={`category:${c.slug}`}
          items={models.map(listingFacets)}
          cards={Object.fromEntries(models.map((m, i) => [m.slug, <ModelCard key={m.slug} model={m} priority={i < 2} headingLevel={2} />]))}
          ages={lines.podbor.ages}
          weights={lines.podbor.weights}
          ageLabels={ageLabels}
        />
      </div>

      <section className="prose-se mt-12">
        {c.seoText.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </section>

      <Faq items={faq} />

      {guides.length > 0 && (
        <section aria-labelledby="cat-guides" className="pb-4">
          <h2 id="cat-guides" className="h-section mb-6">
            {t('category.guidesTitle')}
          </h2>
          <ul className="grid md:grid-cols-3 md:gap-x-8">
            {guides.map((g) => (
              <li key={g.slug} className="border-t border-line">
                <Link href={`/k/${g.slug}`} className="group flex min-h-[72px] items-center justify-between gap-4 py-5">
                  <span className="font-display text-xl leading-snug group-hover:underline group-hover:underline-offset-4">{g.h1}</span>
                  <span aria-hidden="true" className="text-accent transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label={t('category.otherCategories')} className="mt-12">
        <p className="eyebrow mb-3">{t('category.otherCategories')}</p>
        <ul className="flex flex-wrap gap-2">
          {others.map((o) => (
            <li key={o.slug}>
              <Link href={`/c/${o.slug}`} className="chip">
                {o.nameShort}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: c.name,
          numberOfItems: models.length,
          itemListElement: models.map((m, i) => ({ '@type': 'ListItem', position: i + 1, url: absUrl(`/p/${m.slug}`), name: m.name })),
        }}
      />
    </div>
  );
}
