import type { Metadata } from 'next';
import Link from 'next/link';
import homeContent from '@/content/ru/home.json';
import { getCatalog, getModel, getTrustNumbers, isQuotable } from '@/lib/catalog';
import { getGuides } from '@/lib/guides';
import { formatNumber, t } from '@/lib/i18n';
import { alternatesFor, socialMeta } from '@/lib/seo';
import { fmtRating } from '@/lib/summary';
import { allReviewsDTO } from '@/lib/reviews-data';
import { ModelCard } from '@/components/product/ModelCard';
import { LiteYouTube } from '@/components/product/LiteYouTube';
import { Faq } from '@/components/ui/Faq';
import { Stars } from '@/components/ui/Stars';
import { AfterLoadImg } from '@/components/ui/AfterLoadImg';

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

  // Цифры первого экрана: лет на рынке - со слов Эммы, остальное - из Kaspi.
  const shopRating = trust.merchantRating ?? trust.rating;
  const stats = [
    trust.marketYears !== null && { icon: 'calendar', value: t('common.yearsCount', { count: trust.marketYears }), label: t('home.statMarket') },
    trust.years !== null && { icon: 'bag', value: t('common.yearsCount', { count: trust.years }), label: t('home.statKaspi') },
    trust.ordersSegment && { icon: 'box', value: t('trust.orders', { value: formatNumber(trust.ordersSegment) }), label: t('home.statOrders') },
    shopRating !== null && {
      icon: 'star',
      value: fmtRating(shopRating),
      label: t('home.statRating', { reviews: t('common.reviewsCount', { count: trust.reviews }) }),
    },
  ].filter((x): x is { icon: StatIconName; value: string; label: string } => Boolean(x));

  return (
    <>
      {/* Первый экран - сиреневым блоком, цифры - отдельными плашками (Эмма, 2026-11-05: «шапка сливается в одно»). */}
      <section className="container-page pb-8 pt-3 md:pb-12 md:pt-6">
        <div className="rounded-[var(--radius-card)] bg-accent-soft px-4 py-6 md:px-10 md:py-10">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-accent">{t('home.eyebrow')}</p>
          <h1 className="mt-2 max-w-3xl text-[1.375rem] leading-snug tracking-[-0.01em] md:text-[2rem]">{t('home.h1')}</h1>
          {stats.length > 0 && (
            <ul aria-label={t('trust.sourceNote')} className="mt-5 grid grid-cols-2 gap-2 md:mt-7 md:grid-cols-4 md:gap-3">
              {stats.map((x) => (
                <li key={x.icon} className="flex flex-col gap-1 rounded-[var(--radius-card)] bg-surface px-3 py-3 md:px-4 md:py-4">
                  <StatIcon name={x.icon} />
                  <span className="mt-1 text-[1.25rem] font-semibold leading-tight tabular-nums md:text-[1.5rem]">{x.value}</span>
                  <span className="text-[0.8125rem] leading-snug text-ink-2 md:text-sm">{x.label}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/podbor" className="btn btn-primary press mt-5 w-full md:mt-7 md:w-auto">
            {t('home.podborCta')}
          </Link>
        </div>
      </section>

      <section aria-labelledby="hits" className="container-page pb-10 md:pb-14">
        <h2 id="hits" className="h-section">
          {t('home.hitsTitle')}
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-4 md:gap-x-4 lg:grid-cols-5">
          {/* Фото первых двух карточек видно на первом экране телефона - это LCP, грузим сразу. */}
          {hits.map((m, i) => (
            <li key={m.slug}>
              <ModelCard model={m} priority={i < 2} />
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
            <h2 id="home-reviews" className="h-section">
              {t('home.reviewsTitle')}
            </h2>
            <Link href="/otzyvy" className="inline-flex min-h-11 items-center text-[0.9375rem] font-semibold underline decoration-line-strong underline-offset-[6px] hover:decoration-ink">
              {t('home.allReviews')}
            </Link>
          </div>
          <ul className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-3">
            {photoReviews.map((r) => (
              <li key={r.id} className="relative flex w-[86%] shrink-0 snap-start gap-3 rounded-[var(--radius-card)] bg-sand p-3 sm:w-[60%] md:w-auto">
                {r.photos[0] && (
                  <span className="skeleton block aspect-[3/4] w-24 shrink-0 self-start overflow-hidden rounded md:w-28">
                    <AfterLoadImg src={r.photos[0].medium} alt={t('reviews.photoAlt', { name: r.author })} width={112} height={150} className="h-full w-full object-cover" />
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

type StatIconName = 'calendar' | 'bag' | 'box' | 'star';

const STAT_PATHS: Record<StatIconName, string> = {
  calendar: 'M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12ZM4 10h16M8.5 3v4M15.5 3v4',
  bag: 'M5.5 8h13l-1 12h-11l-1-12ZM9 10V7a3 3 0 0 1 6 0v3',
  box: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3ZM4 7.5l8 4.5 8-4.5M12 12v9',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.25 4.15 1 5.85L12 16.95 6.75 19.7l1-5.85L3.5 9.7l5.9-.9L12 3.5Z',
};

function StatIcon({ name }: { name: StatIconName }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="text-accent">
      <path d={STAT_PATHS[name]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
