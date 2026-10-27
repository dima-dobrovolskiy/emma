'use client';

import { useMemo, useState } from 'react';
import { formatDate, formatNumber, t } from '@/lib/i18n';
import { fmtRatingClient } from '@/lib/format';
import { track } from '@/lib/analytics/events';
import type { ReviewDTO } from '@/lib/reviews-dto';

type Option = { value: string; label: string };

type Props = {
  id?: string;
  initial: ReviewDTO[];
  /** Отзывов с текстом на Kaspi (как считает Kaspi). */
  totalWithText: number;
  /** Сколько отзывов в полном списке (с текстом плюс отзывы только с фото). */
  totalListed: number;
  ratingCount: number;
  ratingAvg: number | null;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  dataUrl: string;
  groupBy: 'variant' | 'model';
  groupOptions: Option[];
  pageSize?: number;
  analyticsPage: string;
};

export function ReviewsBlock({
  id = 'reviews',
  initial,
  totalWithText,
  totalListed,
  ratingCount,
  ratingAvg,
  distribution,
  dataUrl,
  groupBy,
  groupOptions,
  pageSize = 6,
  analyticsPage,
}: Props) {
  const [all, setAll] = useState<ReviewDTO[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [stars, setStars] = useState<number | null>(null);
  const [photos, setPhotos] = useState(false);
  const [group, setGroup] = useState('');
  const [shown, setShown] = useState(pageSize);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const needAll = stars !== null || photos || group !== '' || shown > initial.length;

  // Полный список отзывов модели - отдельный статический JSON, грузим при первом фильтре или «Показать ещё».
  const ensureAll = () => {
    if (all || loading) return;
    setLoading(true);
    fetch(dataUrl)
      .then((r) => (r.ok ? (r.json() as Promise<ReviewDTO[]>) : Promise.reject(new Error(String(r.status)))))
      .then(setAll)
      .catch(() => setAll(initial))
      .finally(() => setLoading(false));
  };

  const source = all ?? initial;
  const filtered = useMemo(
    () =>
      source.filter(
        (r) =>
          (stars === null || r.rating === stars) &&
          (!photos || r.photos.length > 0) &&
          (group === '' || (groupBy === 'variant' ? r.variantSlug === group : r.modelSlug === group)),
      ),
    [source, stars, photos, group, groupBy],
  );
  const visible = filtered.slice(0, shown);
  const totalForFilter = needAll && all ? filtered.length : totalListed;
  const maxBar = Math.max(1, ...Object.values(distribution));

  const setFilter = (name: string, value: string, apply: () => void) => {
    ensureAll();
    apply();
    setShown(pageSize);
    track('filter_use', { filter: `reviews_${name}`, value, page: analyticsPage });
  };

  if (ratingCount === 0) {
    return <p className="rounded-[var(--radius-card)] bg-sand p-5 text-ink-2">{t('reviews.noReviews')}</p>;
  }

  return (
    <div id={id}>
      <div className="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-10">
        <div>
          {ratingAvg !== null && (
            <p className="flex items-baseline gap-2">
              <span className="font-display text-5xl font-semibold">{fmtRatingClient(ratingAvg)}</span>
              <span className="text-ink-3">/ 5</span>
            </p>
          )}
          <p className="mt-1 text-sm text-ink-2">
            {t('reviews.basedOn', { count: t('common.ratingsCount', { count: ratingCount }) })} · {t('reviews.withText', { count: formatNumber(totalWithText) })}
          </p>
          <ul className="mt-4 space-y-1">
            {([5, 4, 3, 2, 1] as const).map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setFilter('stars', String(s), () => setStars(stars === s ? null : s))}
                  aria-pressed={stars === s}
                  disabled={distribution[s] === 0}
                  aria-label={t('reviews.starsBar', { stars: s, count: distribution[s] })}
                  className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg px-2 text-sm disabled:cursor-default disabled:opacity-60 ${stars === s ? 'bg-sand' : 'hover:bg-sand/60'}`}
                >
                  <span className="w-6 text-right font-semibold">{s}★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand-2">
                    <span className="block h-full rounded-full bg-star" style={{ width: `${(distribution[s] / maxBar) * 100}%` }} />
                  </span>
                  <span className="w-10 text-right text-ink-3">{formatNumber(distribution[s])}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-3">{t('reviews.fromKaspi')}</p>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="chip" aria-pressed={stars === null && !photos && group === ''} onClick={() => setFilter('reset', 'all', () => (setStars(null), setPhotos(false), setGroup('')))}>
              {t('reviews.filterAll')}
            </button>
            <button type="button" className="chip" aria-pressed={photos} onClick={() => setFilter('photos', String(!photos), () => setPhotos(!photos))}>
              {t('reviews.filterPhotos')}
            </button>
            {groupOptions.length > 1 && (
              <label className="chip pr-2">
                <span className="sr-only">{groupBy === 'variant' ? t('reviews.filterColor') : t('reviews.filterModel')}</span>
                <select
                  value={group}
                  onChange={(e) => setFilter(groupBy, e.target.value, () => setGroup(e.target.value))}
                  className="max-w-[14rem] bg-transparent pr-1 outline-none"
                >
                  <option value="">{groupBy === 'variant' ? t('reviews.allColors') : t('reviews.allModels')}</option>
                  {groupOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {loading && !all && <p className="mt-6 text-ink-3">{t('common.loading')}</p>}
          {!loading && visible.length === 0 && <p className="mt-6 text-ink-2">{t('reviews.empty')}</p>}

          <ul className="mt-5 space-y-4">
            {visible.map((r) => (
              <li key={r.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{r.author}</p>
                  <p className="text-sm text-ink-3">
                    <time dateTime={r.date}>{formatDate(r.date)}</time>
                  </p>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm">
                  <span className="text-star" aria-label={t('common.ratingOutOf', { rating: r.rating })}>
                    {'★'.repeat(r.rating)}
                    <span className="text-sand-2">{'★'.repeat(5 - r.rating)}</span>
                  </span>
                  <span className="text-ink-3">{groupBy === 'variant' ? t('reviews.variant', { name: r.variantName }) : r.modelName}</span>
                </p>
                {r.text && <p className="mt-3 whitespace-pre-line">{r.text}</p>}
                {r.plus && (
                  <p className="mt-2 text-sm">
                    <span className="font-semibold">{t('reviews.plus')}:</span> {r.plus}
                  </p>
                )}
                {r.minus && (
                  <p className="mt-1 text-sm">
                    <span className="font-semibold">{t('reviews.minus')}:</span> {r.minus}
                  </p>
                )}
                {r.photos.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {r.photos.slice(0, 6).map((p) => (
                      <li key={p.small}>
                        <button type="button" onClick={() => setLightbox(p.large)} className="block h-20 w-[60px] overflow-hidden rounded-lg bg-sand">
                          <img src={p.small} alt={t('reviews.photoAlt', { name: r.author })} width={60} height={80} loading="lazy" className="h-full w-full object-cover" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 flex items-center gap-3 text-xs text-ink-3">
                  <span>{t('reviews.source')}</span>
                  {r.helpful > 0 && <span>{t('reviews.helpful', { count: r.helpful })}</span>}
                </p>
              </li>
            ))}
          </ul>

          {visible.length < (all ? filtered.length : totalListed) && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  ensureAll();
                  setShown(shown + pageSize * 2);
                }}
                className="btn btn-secondary"
              >
                {t('common.showMore')}
              </button>
              <p className="text-xs text-ink-3">{t('reviews.shown', { shown: visible.length, total: formatNumber(totalForFilter) })}</p>
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-h-[90dvh] max-w-full rounded-xl object-contain" />
          <button type="button" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-xl" aria-label={t('common.close')}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
