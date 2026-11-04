'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDate, formatNumber, t } from '@/lib/i18n';
import { fmtRatingClient } from '@/lib/format';
import { track } from '@/lib/analytics/events';
import type { ReviewDTO } from '@/lib/reviews-dto';
import { Stars } from '@/components/ui/Stars';

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
  const [failed, setFailed] = useState(false);
  const [stars, setStars] = useState<number | null>(null);
  const [photos, setPhotos] = useState(false);
  const [group, setGroup] = useState('');
  const [shown, setShown] = useState(pageSize);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  // Анимация появления - только для карточек, которые пришли после действия пользователя, не при загрузке страницы.
  const [touched, setTouched] = useState(false);


  const needAll = stars !== null || photos || group !== '' || shown > initial.length;

  // Полный список отзывов модели - отдельный статический JSON, грузим при первом фильтре или «Показать ещё».
  const ensureAll = () => {
    if (all || loading) return;
    setLoading(true);
    setFailed(false);
    fetch(dataUrl)
      .then((r) => (r.ok ? (r.json() as Promise<ReviewDTO[]>) : Promise.reject(new Error(String(r.status)))))
      .then(setAll)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  const source = all ?? initial;
  const filtered = useMemo(
    () =>
      source.filter(
        (r) =>
          (stars === null || r.rating === stars) &&
          // Отзывы только с фото, без текста, Kaspi не считает в «отзывах с текстом» - показываем их в фильтре «С фото».
          (photos ? r.photos.length > 0 : Boolean(r.text || r.plus || r.minus)) &&
          (group === '' || (groupBy === 'variant' ? r.variantSlug === group : r.modelSlug === group)),
      ),
    [source, stars, photos, group, groupBy],
  );
  const visible = useMemo(() => filtered.slice(0, shown), [filtered, shown]);
  // Появляются только новые карточки: после «Показать ещё» уже показанные не мигают.
  const [lastVisible, setLastVisible] = useState(visible);
  const [shownIds, setShownIds] = useState(() => new Set(initial.map((r) => r.id)));
  const [fresh, setFresh] = useState<Map<string, number>>(() => new Map());
  if (lastVisible !== visible) {
    const ids = visible.filter((r) => !shownIds.has(r.id)).map((r) => r.id);
    setLastVisible(visible);
    setShownIds(new Set(visible.map((r) => r.id)));
    setFresh(new Map(ids.map((id, n) => [id, n])));
  }
  const totalForFilter = needAll && all ? filtered.length : totalListed;
  const maxBar = Math.max(1, ...Object.values(distribution));

  const setFilter = (name: string, value: string, apply: () => void) => {
    setTouched(true);
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
              <span className="font-display text-[2.75rem] leading-none tabular-nums">{fmtRatingClient(ratingAvg)}</span>
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
                  className={`press flex min-h-[44px] w-full items-center gap-3 rounded-lg px-2 text-sm disabled:cursor-default disabled:opacity-60 ${stars === s ? 'bg-sand' : 'hover:bg-sand/60'}`}
                >
                  <span className="w-6 text-right font-semibold">
                    {s}
                    <span aria-hidden="true">★</span>
                    <span className="sr-only"> {t('reviews.starsWord', { stars: s })}:</span>
                  </span>
                  <span aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-2">
                    <span className="block h-full origin-left rounded-full bg-ink transition-[width] duration-500 ease-out" style={{ width: `${(distribution[s] / maxBar) * 100}%` }} />
                  </span>
                  <span className="w-10 text-right text-ink-3">{formatNumber(distribution[s])}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-3">{t('reviews.fromKaspi')}</p>
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
              <label className="chip pr-2 has-[select:focus-visible]:outline-[3px] has-[select:focus-visible]:outline-offset-2 has-[select:focus-visible]:outline-accent">
                <span className="sr-only">{groupBy === 'variant' ? t('reviews.filterColor') : t('reviews.filterModel')}</span>
                <select
                  value={group}
                  onChange={(e) => setFilter(groupBy, e.target.value, () => setGroup(e.target.value))}
                  className="min-h-11 max-w-[14rem] bg-transparent pr-1 text-base focus-visible:outline-none"
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

          {failed && (
            <p role="alert" className="enter mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-card)] bg-sand px-4 py-3 text-ink-2">
              {t('reviews.loadError')}
              <button type="button" onClick={ensureAll} className="press inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-4">
                {t('common.retry')}
              </button>
            </p>
          )}
          {!loading && !failed && visible.length === 0 && <p className="enter mt-6 text-ink-2">{t('reviews.empty')}</p>}

          <ul className="mt-4 divide-y divide-line" aria-busy={loading}>
            {visible.map((r) => (
              <li
                key={r.id}
                className={`py-6 ${fresh.has(r.id) ? 'enter' : ''}`}
                style={fresh.has(r.id) ? ({ '--i': fresh.get(r.id) } as React.CSSProperties) : undefined}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{r.author}</p>
                  <p className="text-sm text-ink-3">
                    <time dateTime={r.date}>{formatDate(r.date)}</time>
                  </p>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm">
                  <Stars rating={r.rating} showValue={false} />
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
                    {r.photos.slice(0, 6).map((p, n, list) => {
                      const alt = list.length > 1 ? t('reviews.photoAltN', { name: r.author, index: n + 1, total: list.length }) : t('reviews.photoAlt', { name: r.author });
                      return (
                      <li key={p.small}>
                        <button type="button" onClick={() => setLightbox({ src: p.large, alt })} className="press skeleton block h-20 w-16 overflow-hidden rounded-[var(--radius-card)]">
                          <img src={p.small} alt={alt} width={64} height={80} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                        </button>
                      </li>
                      );
                    })}
                  </ul>
                )}
                <p className="mt-3 flex items-center gap-3 text-[0.8125rem] text-ink-3">
                  <span>{t('reviews.source')}</span>
                  {r.helpful > 0 && <span>{t('reviews.helpful', { count: r.helpful })}</span>}
                </p>
              </li>
            ))}
            {loading &&
              !all &&
              Array.from({ length: 3 }, (_, i) => (
                <li key={`sk-${i}`} aria-hidden="true" className="py-6">
                  <span className="skeleton block h-4 w-32 rounded" />
                  <span className="skeleton mt-3 block h-3 w-24 rounded" />
                  <span className="skeleton mt-4 block h-3 w-full rounded" />
                  <span className="skeleton mt-2 block h-3 w-4/5 rounded" />
                </li>
              ))}
          </ul>
          <p className="sr-only" role="status">
            {loading ? t('common.loading') : touched ? t('reviews.shown', { shown: visible.length, total: formatNumber(all ? filtered.length : totalListed) }) : ''}
          </p>

          {visible.length < (all ? filtered.length : totalListed) && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTouched(true);
                  ensureAll();
                  setShown(shown + pageSize * 2);
                }}
                disabled={loading}
                className="btn btn-secondary press min-w-[12rem]"
              >
                {loading ? <span className="spinner" aria-hidden="true" /> : null}
                {t('common.showMore')}
              </button>
              <p className="text-sm text-ink-3">{t('reviews.shown', { shown: visible.length, total: formatNumber(totalForFilter) })}</p>
            </div>
          )}
        </div>
      </div>

      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
    </div>
  );
}

/** Фото покупателя на весь экран: нативный модальный dialog (фокус внутри, Esc закрывает, фон недоступен). */
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.documentElement;
    dialog.showModal();
    root.classList.add('scroll-locked');
    return () => {
      root.classList.remove('scroll-locked');
      opener?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={alt}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="lightbox fixed inset-0 m-0 flex h-dvh max-h-none w-screen max-w-none items-center justify-center bg-ink/85 p-4 backdrop:bg-transparent"
    >
      <span className="spinner spinner-light absolute" aria-hidden="true" />
      <img src={src} alt={alt} className="lightbox-img relative max-h-[90dvh] max-w-full rounded-[var(--radius-card)] object-contain" />
      <button type="button" autoFocus onClick={onClose} className="press absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-xl" aria-label={t('common.close')}>
        ×
      </button>
    </dialog>
  );
}
