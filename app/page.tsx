import type { Metadata } from 'next';
import Link from 'next/link';
import homeContent from '@/content/ru/home.json';
import { getCatalog, getModel, getTrustNumbers, isQuotable } from '@/lib/catalog';
import { getGuides } from '@/lib/guides';
import { formatNumber, t } from '@/lib/i18n';
import { alternatesFor, socialMeta } from '@/lib/seo';
import { gallerySrcSet } from '@/lib/images';
import { fmtRating } from '@/lib/summary';
import { allReviewsDTO } from '@/lib/reviews-data';
import { ModelCard } from '@/components/product/ModelCard';
import { LiteYouTube } from '@/components/product/LiteYouTube';
import { Faq } from '@/components/ui/Faq';
import { Stars } from '@/components/ui/Stars';

const HITS_COUNT = 10;

export function generateMetadata(): Metadata {
  const tr = getTrustNumbers();
  const { models } = getCatalog();
  const title = t('meta.homeTitle');
  const description = t('meta.homeDescription', { models: models.length, reviews: formatNumber(tr.reviews), rating: tr.rating !== null ? fmtRating(tr.rating) : '-' });
  return {
    title: { absolute: title },
    description,
    alternates: alternatesFor('/'),
    ...socialMeta({ title, description, path: '/' }),
  };
}

export default function HomePage() {
  const { models } = getCatalog();
  const trust = getTrustNumbers();
  const hero = getModel(homeContent.heroModel) ?? models[0]!;
  const heroImg = hero.defaultVariant.images[0];
  // Эмма (2026-11-04): с хитов начинается главная, 10 моделей - по две в ряд на телефоне.
  const hits = [...models].sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, HITS_COUNT);
  const guides = getGuides();
  const videos = homeContent.videos
    .map((s) => getModel(s))
    .filter((m): m is NonNullable<typeof m> => Boolean(m && m.videoIds[0]))
    .map((m) => ({ id: m.videoIds[0]!, title: m.name }));
  const photoReviews = allReviewsDTO()
    .filter((r) => r.photos.length > 0 && r.text.length >= 60 && r.text.length <= 280 && r.rating === 5 && isQuotable(r))
    .slice(0, 6);

  // Сноска под заголовком вместо крупных цифр: лет на рынке - со слов Эммы, остальное - из Kaspi.
  const shopRating = trust.merchantRating ?? trust.rating;
  const trustLine = [
    trust.marketYears !== null && t('trust.marketYears', { count: trust.marketYears }),
    trust.years !== null && t('trust.kaspiYears', { count: trust.years }),
    trust.reviews > 0 && t('trust.reviewsCount', { count: trust.reviews }),
    shopRating !== null && t('trust.shopRating', { value: fmtRating(shopRating) }),
  ].filter((x): x is string => Boolean(x));

  return (
    <>
      <section className="container-page grid gap-5 pb-10 pt-4 md:grid-cols-12 md:items-center md:gap-10 md:pb-14 md:pt-8">
        <div className="md:col-span-6 lg:col-span-5">
          <h1 className="text-[1.375rem] leading-snug tracking-[-0.01em] md:text-[1.75rem]">{t('home.h1')}</h1>
          {trustLine.length > 0 && (
            <p className="mt-3 flex flex-wrap gap-x-2 gap-y-0.5 text-sm text-ink-3" aria-label={t('trust.sourceNote')}>
              {/* Разделитель после пункта: при переносе точка остаётся в конце строки, а не в начале следующей. */}
              {trustLine.map((item, i) => (
                <span key={item} className="whitespace-nowrap">
                  {item}
                  {i < trustLine.length - 1 && (
                    <span aria-hidden="true" className="ml-2">
                      ·
                    </span>
                  )}
                </span>
              ))}
            </p>
          )}
        </div>
        {heroImg && (
          <figure className="md:col-span-6 lg:col-span-7">
            <Link href={`/p/${hero.slug}`} prefetch={false} className="group block overflow-hidden rounded-[var(--radius-card)] bg-sand-2">
              <span className="block aspect-[4/3] w-full md:aspect-[16/9]">
                <img
                  {...gallerySrcSet(heroImg)}
                  sizes="(min-width: 1024px) 56vw, (min-width: 768px) 50vw, 100vw"
                  alt={t('model.variantName', { line: hero.lineLabel, design: hero.defaultVariant.designName })}
                  width={750}
                  height={1000}
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover object-[50%_28%] transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
              </span>
            </Link>
            <figcaption className="mt-2 flex flex-wrap items-center gap-x-3 text-sm text-ink-3">
              <Link href={`/p/${hero.slug}`} prefetch={false} className="inline-flex min-h-11 items-center font-semibold text-ink hover:underline md:min-h-0">
                {hero.name}
              </Link>
              <Stars rating={hero.ratingAvg} count={hero.reviewsCount} compact />
            </figcaption>
          </figure>
        )}
      </section>

      <section aria-labelledby="hits" className="container-page pb-10 md:pb-14">
        <h2 id="hits" className="h-section">
          {t('home.hitsTitle')}
        </h2>
        <p className="mt-1 text-sm text-ink-3">{t('home.hitsLead')}</p>
        <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-4 md:gap-x-4 lg:grid-cols-5">
          {hits.map((m) => (
            <li key={m.slug}>
              <ModelCard model={m} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="podbor" className="container-page pb-10 md:pb-14">
        <div className="flex flex-col gap-4 rounded-[var(--radius-card)] bg-accent-soft p-5 md:flex-row md:items-center md:justify-between md:gap-8 md:px-8 md:py-7">
          <div>
            <h2 id="podbor" className="h-section">
              {t('home.podborTitle')}
            </h2>
            <p className="mt-1 text-ink-2">{t('home.podborText')}</p>
          </div>
          <Link href="/podbor" className="btn btn-primary press w-full shrink-0 md:w-auto">
            {t('home.podborCta')}
          </Link>
        </div>
      </section>

      {photoReviews.length > 0 && (
        <section aria-labelledby="home-reviews" className="container-page pb-10 md:pb-14">
          <div className="flex flex-wrap items-end justify-between gap-x-3">
            <div>
              <h2 id="home-reviews" className="h-section">
                {t('home.reviewsTitle')}
              </h2>
              <p className="mt-1 text-sm text-ink-3">{t('home.reviewsLead')}</p>
            </div>
            <Link href="/otzyvy" className="inline-flex min-h-11 items-center text-[0.9375rem] font-semibold underline decoration-line-strong underline-offset-[6px] hover:decoration-ink">
              {t('home.allReviews')}
            </Link>
          </div>
          <ul className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-3">
            {photoReviews.map((r) => (
              <li key={r.id} className="relative flex w-[86%] shrink-0 snap-start gap-3 rounded-[var(--radius-card)] bg-sand p-3 sm:w-[60%] md:w-auto">
                {r.photos[0] && (
                  <span className="skeleton block aspect-[3/4] w-24 shrink-0 self-start overflow-hidden rounded md:w-28">
                    <img src={r.photos[0].medium} alt={t('reviews.photoAlt', { name: r.author })} width={112} height={150} loading="lazy" className="h-full w-full object-cover" />
                  </span>
                )}
                <div className="min-w-0 flex-1 text-sm">
                  <Stars rating={r.rating} showValue={false} />
                  <p className="mt-1.5 line-clamp-5">{r.text}</p>
                  <p className="mt-1.5 text-[0.8125rem] text-ink-3">
                    {r.author} ·{' '}
                    <Link href={`/p/${r.modelSlug}`} prefetch={false} className="underline underline-offset-2 after:absolute after:inset-0">
                      {r.modelName}
                    </Link>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="how" className="bg-sand">
        <div className="container-page section">
          <h2 id="how" className="h-section mb-6 md:mb-8">
            {t('home.howTitle')}
          </h2>
          <ol className="grid gap-5 md:grid-cols-3 md:gap-8">
            {(['how1', 'how2', 'how3'] as const).map((k, i) => (
              <li key={k} className="reveal flex gap-4 border-t border-ink/15 pt-4 md:block">
                <span aria-hidden="true" className="w-6 shrink-0 font-display text-[1.75rem] leading-none text-accent">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-base md:mt-2">{t(`home.${k}Title`)}</h3>
                  <p className="mt-1 text-ink-2">{t(`home.${k}Text`)}</p>
                </div>
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
          <p className="mt-1 max-w-2xl text-sm text-ink-3">{t('home.mediaLead')}</p>
          <ul className="mt-5 grid gap-5 md:grid-cols-3 md:gap-4">
            {videos.map((v) => (
              <li key={v.id} className="reveal">
                <LiteYouTube id={v.id} title={v.title} />
                <p className="mt-2 text-[0.9375rem] font-semibold">{v.title}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {guides.length > 0 && (
        <section aria-labelledby="home-guides" className="container-page pb-10 md:pb-14">
          <h2 id="home-guides" className="h-section mb-5">
            {t('home.guidesTitle')}
          </h2>
          <ul className="grid gap-3 md:grid-cols-3 md:gap-4">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={`/k/${g.slug}`} className="plate group">
                  <span className="font-display text-[1.125rem] leading-snug md:text-[1.25rem]">{g.h1}</span>
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
