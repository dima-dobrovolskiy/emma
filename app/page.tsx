import type { Metadata } from 'next';
import Link from 'next/link';
import homeContent from '@/content/ru/home.json';
import { getCatalog, getModel, getTrustNumbers } from '@/lib/catalog';
import { getGuides } from '@/lib/guides';
import { formatNumber, t } from '@/lib/i18n';
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
    alternates: { canonical: '/' },
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
    .filter((r) => r.photos.length > 0 && r.text.length >= 60 && r.text.length <= 280 && r.rating === 5)
    .slice(0, 6);

  const trustItems = [
    trust.years !== null && { value: t('common.yearsCount', { count: trust.years }), label: t('trust.yearsLabel') },
    trust.ordersSegment !== null && { value: t('trust.orders', { value: formatNumber(trust.ordersSegment) }), label: t('trust.ordersLabel') },
    { value: formatNumber(trust.reviews), label: t('trust.reviewsLabel') },
    trust.rating !== null && { value: fmtRating(trust.rating), label: t('trust.ratingLabel') },
  ].filter((x): x is { value: string; label: string } => Boolean(x));

  return (
    <>
      <section className="container-page grid items-center gap-8 pb-10 pt-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-12 md:pt-12">
        <div>
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1 className="mt-3 text-[2.4rem] leading-[1.05] md:text-[3.6rem]">{t('home.h1')}</h1>
          <p className="mt-4 max-w-xl text-lg text-ink-2">{t('home.lead')}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/podbor" className="btn btn-primary">
              {t('home.ctaPodbor')}
            </Link>
            <Link href="/c/ergoryukzaki" className="btn btn-secondary">
              {t('home.ctaCatalog')}
            </Link>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 sm:grid-cols-4">
            {trustItems.map((i) => (
              <div key={i.label}>
                <dt className="sr-only">{i.label}</dt>
                <dd>
                  <span className="block font-display text-2xl font-semibold md:text-[1.75rem]">{i.value}</span>
                  <span className="text-sm text-ink-3">{i.label}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-ink-3">{t('trust.sourceNote')}</p>
        </div>
        {heroImg && (
          <Link href={`/p/${hero.slug}`} className="relative block overflow-hidden rounded-[2rem] bg-sand">
            <img
              {...gallerySrcSet(heroImg)}
              sizes="(min-width: 768px) 45vw, 100vw"
              alt={t('model.variantName', { line: hero.lineLabel, design: hero.defaultVariant.designName })}
              width={750}
              height={1000}
              fetchPriority="high"
              className="aspect-[4/5] w-full object-cover md:aspect-[3/4]"
            />
            <span className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-2xl bg-surface/95 px-4 py-3 shadow">
              <span className="font-semibold">{hero.name}</span>
              <Stars rating={hero.ratingAvg} />
            </span>
          </Link>
        )}
      </section>

      <section aria-labelledby="age" className="bg-sand/60 py-10">
        <div className="container-page">
          <h2 id="age" className="text-2xl md:text-3xl">
            {t('home.ageTitle')}
          </h2>
          <p className="mt-2 text-ink-2">{t('home.ageLead')}</p>
          <ul className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {lines.podbor.ages.map((a) => (
              <li key={a.id} className="shrink-0">
                <Link href={`/podbor?age=${a.id}`} className="chip px-5 font-semibold hover:border-ink">
                  {t(`age.${a.id}` as 'age.0-3')}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="cats" className="container-page py-12">
        <h2 id="cats" className="mb-5 text-2xl md:text-3xl">
          {t('home.categoriesTitle')}
        </h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
          {categories
            .filter((c) => c.models.length)
            .map((c) => {
              const img = c.models[0]?.defaultVariant.images[0];
              return (
                <li key={c.slug}>
                  <Link href={`/c/${c.slug}`} className="group block overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-card)]">
                    <span className="block aspect-square overflow-hidden bg-sand">
                      {img && (
                        <img {...cardSrcSet(img)} sizes="(min-width: 768px) 20vw, 50vw" alt="" width={370} height={493} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                      )}
                    </span>
                    <span className="block px-4 py-3">
                      <span className="block font-semibold">{c.nameShort}</span>
                      <span className="text-sm text-ink-3">{t('common.modelsCount', { count: c.models.length })}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
        </ul>
      </section>

      <section aria-labelledby="hits" className="container-page py-6">
        <h2 id="hits" className="text-2xl md:text-3xl">
          {t('home.hitsTitle')}
        </h2>
        <p className="mt-1 text-ink-2">{t('home.hitsLead')}</p>
        <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {hits.map((m) => (
            <li key={m.slug}>
              <ModelCard model={m} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how" className="container-page py-12">
        <h2 id="how" className="mb-5 text-2xl md:text-3xl">
          {t('home.howTitle')}
        </h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {(['how1', 'how2', 'how3'] as const).map((k, i) => (
            <li key={k} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-semibold text-accent-ink">{i + 1}</span>
              <p className="mt-3 font-semibold">{t(`home.${k}Title`)}</p>
              <p className="mt-1 text-ink-2">{t(`home.${k}Text`)}</p>
            </li>
          ))}
        </ol>
      </section>

      {videos.length > 0 && (
        <section aria-labelledby="media" className="bg-sand/60 py-12">
          <div className="container-page">
            <h2 id="media" className="text-2xl md:text-3xl">
              {t('home.mediaTitle')}
            </h2>
            <p className="mt-1 text-ink-2">{t('home.mediaLead')}</p>
            <ul className="mt-5 grid gap-4 md:grid-cols-3">
              {videos.map((v) => (
                <li key={v.id}>
                  <LiteYouTube id={v.id} title={v.title} />
                  <p className="mt-2 font-semibold">{v.title}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {photoReviews.length > 0 && (
        <section aria-labelledby="home-reviews" className="container-page py-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="home-reviews" className="text-2xl md:text-3xl">
                {t('home.reviewsTitle')}
              </h2>
              <p className="mt-1 text-ink-2">{t('home.reviewsLead')}</p>
            </div>
            <Link href="/otzyvy" className="btn btn-secondary">
              {t('home.allReviews')}
            </Link>
          </div>
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {photoReviews.map((r) => (
              <li key={r.id} className="flex gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
                {r.photos[0] && <img src={r.photos[0].small} alt={t('reviews.photoAlt', { name: r.author })} width={72} height={96} loading="lazy" className="h-24 w-[72px] shrink-0 rounded-xl object-cover" />}
                <div className="min-w-0">
                  <p className="text-sm text-star">{'★'.repeat(r.rating)}</p>
                  <p className="mt-1 line-clamp-4 text-[0.95rem]">{r.text}</p>
                  <p className="mt-2 text-xs text-ink-3">
                    {r.author} · <Link href={`/p/${r.modelSlug}`} className="underline underline-offset-2">{r.modelName}</Link>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {guides.length > 0 && (
        <section aria-labelledby="home-guides" className="container-page py-6">
          <h2 id="home-guides" className="mb-5 text-2xl md:text-3xl">
            {t('home.guidesTitle')}
          </h2>
          <ul className="grid gap-3 md:grid-cols-3">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={`/k/${g.slug}`} className="flex h-full flex-col justify-between gap-4 rounded-[var(--radius-card)] bg-sage-soft p-5 hover:bg-sage-soft/70">
                  <span className="font-display text-xl font-semibold text-ink">{g.h1}</span>
                  <span className="text-sm font-semibold text-sage">{t('guides.read')} →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="container-page">
        <Faq items={homeContent.faq} title={t('home.faqTitle')} />
      </div>
    </>
  );
}
