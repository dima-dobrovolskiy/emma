import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalog, getModel, modelDistribution, type Model } from '@/lib/catalog';
import { getCheckoutProvider } from '@/lib/commerce';
import { flags } from '@/lib/flags';
import { formatDate, formatPrice, t } from '@/lib/i18n';
import { absUrl } from '@/lib/site';
import { maxWeightKg, modelSummary, renderTemplate, fmtRating } from '@/lib/summary';
import { modelReviewsDTO } from '@/lib/reviews-data';
import { getGuideMeta } from '@/lib/guides';
import { ModelView, type ViewVariant } from '@/components/product/ModelView';
import { ModelCard } from '@/components/product/ModelCard';
import { LiteYouTube } from '@/components/product/LiteYouTube';
import { Specs } from '@/components/product/Specs';
import { ReviewsBlock } from '@/components/reviews/ReviewsBlock';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Faq } from '@/components/ui/Faq';
import { JsonLd } from '@/components/ui/JsonLd';
import { Short } from '@/components/ui/Short';
import { Stars } from '@/components/ui/Stars';

type Params = { params: Promise<{ model: string }> };

export function generateStaticParams() {
  return getCatalog().models.map((m) => ({ model: m.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { model: slug } = await params;
  const m = getModel(slug);
  if (!m) return {};
  const price = formatPrice(m.minPrice);
  const reviews = t('common.reviewsCount', { count: m.reviewsCount });
  const title = m.seo.title ?? (m.reviewsCount > 0 ? t('meta.modelTitle', { name: m.name, price, reviews }) : t('meta.modelTitleNoReviews', { name: m.name, price }));
  const credit = m.defaultVariant.creditMonthlyPrice ? t('meta.modelDescriptionCredit', { credit: m.defaultVariant.creditMonthlyPrice }) : '';
  const colors = t('common.colorsCount', { count: m.variants.length });
  const description =
    m.seo.description ??
    (m.ratingCount > 0 && m.ratingAvg !== null
      ? t('meta.modelDescription', { name: m.name, price, credit, rating: fmtRating(m.ratingAvg), reviews, colors })
      : t('meta.modelDescriptionNoReviews', { name: m.name, price, credit, colors }));
  const img = m.defaultVariant.images[0];
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/p/${m.slug}` },
    openGraph: { title, description, url: absUrl(`/p/${m.slug}`), images: img ? [{ url: img.large, width: 1080, height: 1440 }] : [] },
    twitter: { title, description, images: img ? [img.large] : [] },
  };
}

export default async function ModelPage({ params }: Params) {
  const { model: slug } = await params;
  const model = getModel(slug);
  if (!model) notFound();
  const { categories, pricesDate } = getCatalog();
  const category = categories.find((c) => c.slug === model.category);
  const provider = getCheckoutProvider();
  const summary = modelSummary(model);
  const reviews = modelReviewsDTO(model);
  const distribution = modelDistribution(model);
  const date = formatDate(pricesDate);
  const guide = model.guide ? getGuideMeta(model.guide) : null;

  const variants: ViewVariant[] = model.variants.map((v) => {
    const action = provider.buyAction(v);
    return {
      kaspiCode: v.kaspiCode,
      designSlug: v.designSlug,
      designName: v.designName,
      inStock: v.inStock,
      price: v.price,
      priceBeforeDiscount: v.priceBeforeDiscount,
      creditMonthlyPrice: v.creditMonthlyPrice,
      creditMonths: v.creditMonths,
      bonus: v.bonus,
      buyHref: action.kind === 'external' ? action.href : v.kaspiUrl,
      images: v.images,
    };
  });

  // Бейдж возраста и веса - только из подтверждённых диапазонов (content/lines.json, verified: true).
  const badge =
    model.rangesVerified && model.ageRange?.from != null && model.weightRange?.to != null
      ? t('model.badgeAgeWeight', { age: t('common.monthsCount', { count: model.ageRange.from }), weight: model.weightRange.to })
      : null;

  const similar = getCatalog()
    .models.filter((m) => m.slug !== model.slug && (m.category === model.category || (model.category === 'ergoryukzaki' && m.category === 'slingi')))
    .slice(0, 4);

  const whoFor = model.whoFor.map((x) => renderTemplate(x, model));
  const howToWear = model.howToWear.map((x) => renderTemplate(x, model));
  const care = model.care.map((x) => renderTemplate(x, model));
  const faq = model.faq.map((f) => ({ q: renderTemplate(f.q, model), a: renderTemplate(f.a, model) }));

  return (
    <>
      <div className="container-page pb-24 pt-4 md:pb-10">
        <Breadcrumbs items={[...(category ? [{ name: category.nameShort, href: `/c/${category.slug}` }] : []), { name: model.name, href: `/p/${model.slug}` }]} />
        <div className="mt-3">
          <ModelView
            modelSlug={model.slug}
            modelName={model.name}
            lineLabel={model.lineLabel}
            variants={variants}
            defaultSlug={model.defaultVariant.designSlug}
            badge={badge}
            pricesDate={date}
            bonusPopup={flags.bonusPopup}
            ratingSlot={
              model.ratingCount > 0 ? (
                <a href="#reviews" className="inline-flex min-h-[44px] items-center hover:underline">
                  <Stars rating={model.ratingAvg} count={model.reviewsCount} size="md" />
                </a>
              ) : null
            }
          />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-10">
            <Short text={summary} date={t('common.pricesActual', { date })} />

            {whoFor.length > 0 && (
              <section aria-labelledby="who">
                <h2 id="who" className="mb-4 text-2xl md:text-3xl">
                  {t('model.whoFor')}
                </h2>
                <ul className="space-y-2.5">
                  {whoFor.map((x) => (
                    <li key={x} className="flex gap-3">
                      <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <Specs model={model} />

            {(model.videoIds.length > 0 || howToWear.length > 0) && (
              <section aria-labelledby="wear">
                <h2 id="wear" className="mb-4 text-2xl md:text-3xl">
                  {t('model.howToWear')}
                </h2>
                {howToWear.map((x) => (
                  <p key={x} className="mb-3 text-ink-2">
                    {x}
                  </p>
                ))}
                <div className="grid gap-4 sm:grid-cols-2">
                  {model.videoIds.slice(0, 2).map((id) => (
                    <LiteYouTube key={id} id={id} title={model.name} />
                  ))}
                </div>
              </section>
            )}

            {care.length > 0 && (
              <section aria-labelledby="care">
                <h2 id="care" className="mb-4 text-2xl md:text-3xl">
                  {t('model.care')}
                </h2>
                <ul className="list-disc space-y-1.5 pl-5">
                  {care.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            {model.variants.length > 1 && (
              <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
                <p className="font-semibold">{t('model.allColors')}</p>
                <p className="text-sm text-ink-3">{t('model.colorsAvailable', { inStock: model.inStockCount, total: model.variants.length })}</p>
                <ul className="mt-3 space-y-1 text-sm">
                  {model.variants.map((v) => (
                    <li key={v.kaspiCode}>
                      <Link href={`/p/${model.slug}?color=${v.designSlug}`} className="flex min-h-[44px] items-center justify-between gap-3 hover:text-accent">
                        <span>{v.designName}</span>
                        <span className={v.inStock ? 'text-ink-2' : 'text-ink-3'}>{v.inStock ? formatPrice(v.price) : t('common.outOfStock')}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {guide && (
              <Link href={`/k/${guide.slug}`} className="block rounded-[var(--radius-card)] bg-sage-soft p-5 hover:bg-sage-soft/70">
                <p className="eyebrow">{t('model.compare')}</p>
                <p className="mt-1 font-semibold text-sage">{guide.title}</p>
              </Link>
            )}
          </aside>
        </div>

        <section aria-labelledby="reviews-title" className="mt-14">
          <h2 id="reviews-title" className="mb-6 text-2xl md:text-3xl">
            {t('reviews.title')}
          </h2>
          <ReviewsBlock
            initial={reviews.slice(0, 6)}
            totalWithText={reviews.length}
            ratingCount={model.ratingCount}
            ratingAvg={model.ratingAvg}
            distribution={distribution}
            dataUrl={`/data/reviews/${model.slug}.json`}
            groupBy="variant"
            groupOptions={model.variants.filter((v) => v.reviewsCount > 0).map((v) => ({ value: v.designSlug, label: v.designName }))}
            analyticsPage={`model:${model.slug}`}
          />
        </section>

        <Faq items={faq} />

        {similar.length > 0 && (
          <section aria-labelledby="similar" className="pt-4">
            <h2 id="similar" className="mb-5 text-2xl md:text-3xl">
              {t('model.similar')}
            </h2>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
              {similar.map((m) => (
                <li key={m.slug}>
                  <ModelCard model={m} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <JsonLd data={productJsonLd(model, summary, reviews.slice(0, 5))} />
    </>
  );
}

function productJsonLd(model: Model, description: string, reviews: ReturnType<typeof modelReviewsDTO>) {
  const inStock = model.variants.filter((v) => v.inStock);
  const maxW = maxWeightKg(model);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': absUrl(`/p/${model.slug}#product`),
    name: model.name,
    description,
    url: absUrl(`/p/${model.slug}`),
    image: model.defaultVariant.images.slice(0, 5).map((i) => i.large),
    brand: { '@type': 'Brand', name: t('jsonld.brand') },
    sku: model.defaultVariant.kaspiCode,
    ...(model.materials.length ? { material: model.materials.join(', ') } : {}),
    ...(maxW !== null ? { additionalProperty: [{ '@type': 'PropertyValue', name: t('jsonld.maxWeight'), value: maxW, unitCode: 'KGM' }] } : {}),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'KZT',
      lowPrice: model.minPrice,
      highPrice: model.maxPrice,
      offerCount: inStock.length || model.variants.length,
      availability: inStock.length ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: absUrl(`/p/${model.slug}`),
      seller: { '@type': 'Organization', name: t('jsonld.brand') },
    },
    ...(model.ratingCount > 0 && model.ratingAvg !== null
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: model.ratingAvg,
            bestRating: 5,
            worstRating: 1,
            ratingCount: model.ratingCount,
            reviewCount: model.reviewsCount,
          },
          review: reviews
            .filter((r) => r.text)
            .map((r) => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: r.author || t('jsonld.anonymous') },
              datePublished: r.date,
              reviewBody: r.text,
              reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
            })),
        }
      : {}),
  };
}
