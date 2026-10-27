import type { Metadata } from 'next';
import Link from 'next/link';
import homeContent from '@/content/ru/home.json';
import { getCatalog, getModel, getTrustNumbers, isQuotable } from '@/lib/catalog';
import { getGuides } from '@/lib/guides';
import { formatNumber, t } from '@/lib/i18n';
import { alternatesFor } from '@/lib/seo';
import { gallerySrcSet, cardSrcSet } from '@/lib/images';
import { fmtRating } from '@/lib/summary';
import { allReviewsDTO } from '@/lib/reviews-data';
import { ModelCard } from '@/components/product/ModelCard';
import { LiteYouTube } from '@/components/product/LiteYouTube';
import { Faq } from '@/components/ui/Faq';
import { Stars } from '@/components/ui/Stars';

export function generateMetadata(): Metadata {
  const tr = getTrustNumbers();
  const { models } = getCatalog();
  return {
    title: { absolute: t('meta.homeTitle') },
    description: t('meta.homeDescription', { models: models.length, reviews: formatNumber(tr.reviews), rating: tr.rating !== null ? fmtRating(tr.rating) : '-' }),
    alternates: alternatesFor('/'),
    openGraph: { url: '/', images: getModel(homeContent.heroModel)?.defaultVariant.images[0] ? [{ url: getModel(homeContent.heroModel)!.defaultVariant.images[0]!.large, width: 1080, height: 1440 }] : [] },
  };
}

export default function HomePage() {
  const { categories, models, lines } = getCatalog();
  const trust = getTrustNumbers();
  const hero = getModel(homeContent.heroModel) ?? models[0]!;
  const heroImg = hero.defaultVariant.images[0];
  const hits = [...models].filter((m) => m.reviewsCount > 0).sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, 4);
  const guides = getGuides();
  const videos = homeContent.videos
    .map((s) => getModel(s))
    .filter((m): m is NonNullable<typeof m> => Boolean(m && m.videoIds[0]))
    .map((m) => ({ id: m.videoIds[0]!, title: m.name }));
  const photoReviews = allReviewsDTO()
    .filter((r) => r.photos.length > 0 && r.text.length >= 60 && r.text.length <= 280 && r.rating === 5 && isQuotable(r))
    .slice(0, 6);

  const trustItems = [
    trust.years !== null && { value: t('common.yearsCount', { count: trust.years }), label: t('trust.yearsLabel') },
    trust.ordersSegment !== null && { value: t('trust.orders', { value: formatNumber(trust.ordersSegment) }), label: t('trust.ordersLabel') },
    { value: formatNumber(trust.reviews), label: t('trust.reviewsWord', { count: trust.reviews }) },
    trust.rating !== null && { value: fmtRating(trust.rating), label: t('trust.ratingLabel') },
  ].filter((x): x is { value: string; label: string } => Boolean(x));

  return (
    <>
      <section className="container-page grid gap-8 pb-12 pt-6 md:grid-cols-12 md:items-center md:gap-10 md:pb-20 md:pt-10">
        <div className="md:col-span-5">
          <h1 className="text-[2.5rem] leading-[1.04] tracking-[-0.02em] md:text-[clamp(2.75rem,1.6rem+3.2vw,4.25rem)]">{t('home.h1')}</h1>
          <p className="mt-4 max-w-md text-lg text-ink-2 md:text-xl">{t('home.lead')}</p>
          <div className="mt-7 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-6">
            <Link href="/podbor" className="btn btn-primary w-full sm:w-auto">
              {t('home.ctaPodbor')}
            </Link>
            <Link href="/c/ergoryukzaki" className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-line-strong underline-offset-[6px] hover:decoration-ink">
              {t('home.ctaCatalog')}
            </Link>
          </div>
        </div>
        {heroImg && (
          <figure className="md:col-span-7">
            <Link href={`/p/${hero.slug}`} prefetch={false} className="group block overflow-hidden rounded-[var(--radius-card)] bg-sand-2">
              <span className="block aspect-[4/5] max-h-[62svh] w-full md:aspect-auto md:h-[min(calc(100svh-8rem),46rem)] md:max-h-none">
                <img
                  {...gallerySrcSet(heroImg)}
                  sizes="(min-width: 768px) 56vw, 100vw"
                  alt={t('model.variantName', { line: hero.lineLabel, design: hero.defaultVariant.designName })}
                  width={750}
                  height={1000}
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover object-[50%_22%] transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
              </span>
            </Link>
            <figcaption className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-3">
              <Link href={`/p/${hero.slug}`} prefetch={false} className="inline-flex min-h-11 items-center font-semibold text-ink hover:underline md:min-h-0">
                {hero.name}
              </Link>
              <Stars rating={hero.ratingAvg} count={hero.reviewsCount} />
            </figcaption>
          </figure>
        )}
      </section>

      <section aria-label={t('trust.sourceNote')} className="bg-sand">
        <dl className="container-page grid grid-cols-2 gap-x-6 gap-y-7 py-9 sm:grid-cols-4 md:py-12">
          {trustItems.map((i) => (
            <div key={i.label} className="flex flex-col-reverse">
              <dt className="mt-1 text-sm text-ink-3">{i.label}</dt>
              <dd className="font-display text-[2rem] leading-none tracking-[-0.01em] tabular-nums md:text-[2.5rem]">{i.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="age" className="container-page pt-14 md:pt-20">
        <div className="md:grid md:grid-cols-12 md:items-end md:gap-10">
          <div className="md:col-span-5">
            <h2 id="age" className="h-section">
              {t('home.ageTitle')}
            </h2>
            <p className="mt-2 text-ink-2">{t('home.ageLead')}</p>
          </div>
          <ul className="mt-5 flex flex-wrap gap-2 md:col-span-7 md:mt-0 md:justify-end">
            {lines.podbor.ages.map((a) => (
              <li key={a.id}>
                <Link href={`/podbor?age=${a.id}`} className="chip px-5 font-semibold">
                  {t(`age.${a.id}` as 'age.0-3')}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="cats" className="container-page section">
        <h2 id="cats" className="h-section mb-6 md:mb-8">
          {t('home.categoriesTitle')}
        </h2>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-5 md:gap-x-5">
          {categories
            .filter((c) => c.models.length)
            .map((c, n) => {
              const img = c.models[0]?.defaultVariant.images[0];
              return (
                <li key={c.slug} className={n === 0 ? 'col-span-2 md:col-span-1' : undefined}>
                  <Link href={`/c/${c.slug}`} className="group block">
                    <span className={`skeleton block overflow-hidden rounded-[var(--radius-card)] ${n === 0 ? 'aspect-[3/2] md:aspect-[4/5]' : 'aspect-[4/5]'}`}>
                      {img && (
                        <img
                          {...cardSrcSet(img)}
                          sizes="(min-width: 768px) 20vw, 50vw"
                          alt=""
                          width={370}
                          height={493}
                          loading="lazy"
                          className="h-full w-full object-cover object-[50%_25%] transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                        />
                      )}
                    </span>
                    <span className="mt-3 block font-semibold group-hover:underline group-hover:underline-offset-4">{c.nameShort}</span>
                    <span className="text-sm text-ink-3">{t('common.modelsCount', { count: c.models.length })}</span>
                  </Link>
                </li>
              );
            })}
        </ul>
      </section>

      <section aria-labelledby="hits" className="container-page pb-14 md:pb-20">
        <h2 id="hits" className="h-section">
          {t('home.hitsTitle')}
        </h2>
        <p className="mt-2 text-ink-2">{t('home.hitsLead')}</p>
        <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:mt-8 md:grid-cols-4 md:gap-x-5">
          {hits.map((m) => (
            <li key={m.slug}>
              <ModelCard model={m} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how" className="bg-sand">
        <div className="container-page section">
          <h2 id="how" className="h-section mb-8 md:mb-10">
            {t('home.howTitle')}
          </h2>
          <ol className="grid gap-8 md:grid-cols-3 md:gap-10">
            {(['how1', 'how2', 'how3'] as const).map((k, i) => (
              <li key={k} className="reveal border-t border-ink/15 pt-5">
                <span aria-hidden="true" className="font-display text-[2.25rem] leading-none text-accent">
                  {i + 1}
                </span>
                <h3 className="mt-3 text-lg">{t(`home.${k}Title`)}</h3>
                <p className="mt-1 text-ink-2">{t(`home.${k}Text`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {videos.length > 0 && (
        <section aria-labelledby="media" className="container-page section">
          <h2 id="media" className="h-section">
            {t('home.mediaTitle')}
          </h2>
          <p className="mt-2 max-w-2xl text-ink-2">{t('home.mediaLead')}</p>
          <ul className="mt-6 grid gap-6 md:mt-8 md:grid-cols-3 md:gap-5">
            {videos.map((v) => (
              <li key={v.id} className="reveal">
                <LiteYouTube id={v.id} title={v.title} />
                <p className="mt-3 font-semibold">{v.title}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {photoReviews.length > 0 && (
        <section aria-labelledby="home-reviews" className="container-page pb-14 md:pb-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="home-reviews" className="h-section">
                {t('home.reviewsTitle')}
              </h2>
              <p className="mt-2 text-ink-2">{t('home.reviewsLead')}</p>
            </div>
            <Link href="/otzyvy" className="inline-flex min-h-11 items-center font-semibold underline decoration-line-strong underline-offset-[6px] hover:decoration-ink">
              {t('home.allReviews')}
            </Link>
          </div>
          <ul className="no-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:mt-8 md:grid md:grid-cols-3 md:gap-x-5 md:gap-y-10 md:overflow-visible md:px-0">
            {photoReviews.map((r) => (
              <li key={r.id} className="w-[72%] shrink-0 snap-start sm:w-[45%] md:w-auto">
                {r.photos[0] && (
                  <span className="skeleton block aspect-[4/5] overflow-hidden rounded-[var(--radius-card)]">
                    <img src={r.photos[0].medium} alt={t('reviews.photoAlt', { name: r.author })} width={300} height={375} loading="lazy" className="h-full w-full object-cover" />
                  </span>
                )}
                <div className="mt-3">
                  <Stars rating={r.rating} showValue={false} />
                </div>
                <p className="mt-2 line-clamp-4">{r.text}</p>
                <p className="mt-2 text-sm text-ink-3">
                  {r.author} ·{' '}
                  <Link href={`/p/${r.modelSlug}`} prefetch={false} className="inline-flex min-h-11 items-center underline underline-offset-2 md:min-h-0">
                    {r.modelName}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {guides.length > 0 && (
        <section aria-labelledby="home-guides" className="container-page pb-14 md:pb-20">
          <h2 id="home-guides" className="h-section mb-6 md:mb-8">
            {t('home.guidesTitle')}
          </h2>
          <ul className="grid md:grid-cols-3 md:gap-x-8">
            {guides.map((g) => (
              <li key={g.slug} className="border-t border-line">
                <Link href={`/k/${g.slug}`} className="group flex h-full min-h-11 flex-col justify-between gap-4 py-5">
                  <span className="font-display text-[1.375rem] leading-snug group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{g.h1}</span>
                  <span className="text-sm font-semibold text-accent">
                    {t('guides.read')} <span aria-hidden="true" className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="container-page pb-6">
        <Faq items={homeContent.faq} title={t('home.faqTitle')} />
      </div>
    </>
  );
}
