'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { setUrlParams, useSearch } from '@/lib/hooks';
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics/events';
import { matchAge, matchWeight, type AgeOption, type WeightOption } from '@/lib/podbor-rules';

export type ListingFacets = {
  slug: string;
  order: number;
  minPrice: number;
  rating: number | null;
  reviews: number;
  ageFrom: number | null;
  ageTo: number | null;
  weightFrom: number | null;
  weightTo: number | null;
  carry: string[];
  colors: string[];
  seasons: string[];
};

type Sort = 'popular' | 'cheap' | 'expensive' | 'rating';
type Filters = { age: string; weight: string; carry: string; color: string; season: string };
const EMPTY: Filters = { age: '', weight: '', carry: '', color: '', season: '' };
const SORTS: Array<{ id: Sort; key: 'category.sortPopular' | 'category.sortCheap' | 'category.sortExpensive' | 'category.sortRating' }> = [
  { id: 'popular', key: 'category.sortPopular' },
  { id: 'cheap', key: 'category.sortCheap' },
  { id: 'expensive', key: 'category.sortExpensive' },
  { id: 'rating', key: 'category.sortRating' },
];

type Props = {
  page: string;
  items: ListingFacets[];
  cards: Record<string, React.ReactNode>;
  ages: AgeOption[];
  weights: WeightOption[];
  ageLabels: Record<string, string>;
};

export function CategoryListing({ page, items, cards, ages, weights, ageLabels }: Props) {
  // Фильтры и сортировка живут в адресе (такие адреса закрыты от индексации в robots.txt).
  const search = useSearch();
  const panel = useRef<HTMLDetailsElement>(null);
  const listTop = useRef<HTMLDivElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { f, sort } = useMemo(() => {
    const q = new URLSearchParams(search);
    const filters = { ...EMPTY };
    for (const k of Object.keys(EMPTY) as Array<keyof Filters>) filters[k] = q.get(k) ?? '';
    const s = q.get('sort');
    return { f: filters, sort: (SORTS.some((x) => x.id === s) ? s : 'popular') as Sort };
  }, [search]);

  const update = (key: keyof Filters | 'sort', value: string) => {
    setUrlParams({ [key]: value || null });
    track('filter_use', { filter: key, value: value || 'reset', page });
  };

  const options = useMemo(() => {
    const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, 'ru'));
    return {
      carry: uniq(items.flatMap((i) => i.carry)),
      color: uniq(items.flatMap((i) => i.colors)),
      season: uniq(items.flatMap((i) => i.seasons)),
      age: ages.filter((a) => items.some((i) => matchAge(i, a))),
      weight: weights.filter((w) => items.some((i) => matchWeight(i, w))),
    };
  }, [items, ages, weights]);

  const shown = useMemo(() => {
    const age = ages.find((a) => a.id === f.age);
    const weight = weights.find((w) => w.id === f.weight);
    const list = items.filter(
      (i) =>
        (!age || matchAge(i, age)) &&
        (!weight || matchWeight(i, weight)) &&
        (!f.carry || i.carry.includes(f.carry)) &&
        (!f.color || i.colors.includes(f.color)) &&
        (!f.season || i.seasons.includes(f.season)),
    );
    const by: Record<Sort, (a: ListingFacets, b: ListingFacets) => number> = {
      popular: (a, b) => b.reviews - a.reviews || a.order - b.order,
      cheap: (a, b) => a.minPrice - b.minPrice,
      expensive: (a, b) => b.minPrice - a.minPrice,
      rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviews - a.reviews,
    };
    return [...list].sort(by[sort]);
  }, [items, f, sort, ages, weights]);

  const active = Object.values(f).some(Boolean);
  const groups: Array<{ key: keyof Filters; label: string; values: Array<{ id: string; label: string }> }> = [
    { key: 'age', label: t('category.filterAge'), values: options.age.map((a) => ({ id: a.id, label: ageLabels[a.id] ?? a.id })) },
    { key: 'weight', label: t('category.filterWeight'), values: options.weight.map((w) => ({ id: w.id, label: t(`podbor.weight-${w.id}` as 'podbor.weight-0-7') })) },
    { key: 'carry', label: t('category.filterCarry'), values: options.carry.map((x) => ({ id: x, label: x })) },
    { key: 'color', label: t('category.filterColor'), values: options.color.map((x) => ({ id: x, label: x })) },
    { key: 'season', label: t('category.filterSeason'), values: options.season.map((x) => ({ id: x, label: x })) },
  ];
  const visibleGroups = groups.filter((g) => g.values.length > 1);

  const activeCount = Object.values(f).filter(Boolean).length;
  const reset = () => {
    setUrlParams(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, null])));
    track('filter_use', { filter: 'all', value: 'reset', page });
  };
  // Чипы: в белой панели на телефоне - серые, в серой панели на десктопе - белые.
  const controls = (chip: string) => (
    <>
      {visibleGroups.map((g) => (
        <fieldset key={g.key} className="min-w-0">
          <legend className="mb-2 text-sm font-semibold text-ink-2">{g.label}</legend>
          <div className="flex flex-wrap gap-2">
            {g.values.map((v) => (
              <button key={v.id} type="button" className={chip} aria-pressed={f[g.key] === v.id} onClick={() => update(g.key, f[g.key] === v.id ? '' : v.id)}>
                {v.label}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-semibold text-ink-2">{t('category.sort')}</legend>
        <div className="flex flex-wrap gap-2">
          {SORTS.map((x) => (
            <button key={x.id} type="button" className={chip} aria-pressed={sort === x.id} onClick={() => update('sort', x.id === 'popular' ? '' : x.id)}>
              {t(x.key)}
            </button>
          ))}
        </div>
      </fieldset>
    </>
  );
  const badge = activeCount > 0 && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[0.8125rem] text-accent-ink">{activeCount}</span>;
  const hasFilters = items.length > 1 && (visibleGroups.length > 0 || items.length > 2);

  return (
    <div>
      {hasFilters && (
        <>
          {/* Телефон: кнопка открывает панель снизу. */}
          <button type="button" data-filters-toggle onClick={() => setSheetOpen(true)} className="btn btn-secondary press mb-6 w-full justify-between md:hidden">
            <span>
              {t('category.filtersShow')}
              {badge}
            </span>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" className="text-ink-3">
              <path d="M3 5h14M6 10h8M9 15h2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <Sheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            title={t('category.filtersShow')}
            footer={
              <>
                <button type="button" className="btn btn-secondary press flex-1" onClick={reset} disabled={!active}>
                  {t('category.filtersReset')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary press flex-[2]"
                  onClick={() => {
                    setSheetOpen(false);
                    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    listTop.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
                  }}
                >
                  {t('category.filtersApply', { count: t('common.modelsCount', { count: shown.length }) })}
                </button>
              </>
            }
          >
            {controls('chip press')}
          </Sheet>

          {/* Планшет и компьютер: раскрывающийся блок над списком. */}
          <details ref={panel} className="group mb-6 hidden rounded-[var(--radius-card)] bg-sand md:block md:open:pb-2" open={false}>
            <summary data-filters-toggle className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 font-semibold [&::-webkit-details-marker]:hidden">
              <span>
                {t('category.filtersShow')}
                {badge}
              </span>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" className="shrink-0 text-ink-3 transition-transform duration-300 ease-out group-open:rotate-180">
                <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="space-y-4 px-4 pb-4">
              {controls('chip chip-light press')}
              {active && (
                <button
                  type="button"
                  className="btn btn-secondary min-h-[44px] bg-surface text-sm"
                  onClick={() => {
                    reset();
                    // Кнопка «Сбросить» исчезает - возвращаем фокус на заголовок фильтров.
                    panel.current?.querySelector('summary')?.focus();
                  }}
                >
                  {t('category.filtersReset')}
                </button>
              )}
            </div>
          </details>
        </>
      )}

      <div ref={listTop} className="scroll-mt-20" />
      <p className="mb-3 text-sm text-ink-3" aria-live="polite">
        {t('category.found', { count: shown.length })}
      </p>
      {shown.length === 0 ? (
        <p className="enter rounded-[var(--radius-card)] bg-sand p-5">{t('category.empty')}</p>
      ) : (
        // Ключ списка меняется вместе с фильтрами: карточки заново мягко появляются в новом порядке.
        <ul key={search || 'all'} className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
          {shown.map((i, n) => (
            <li key={i.slug} className={search ? 'enter' : undefined} style={search ? ({ '--i': n } as React.CSSProperties) : undefined}>
              {cards[i.slug]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Панель снизу экрана на нативном <dialog>: фокус внутри, Esc и тап по фону закрывают, фон недоступен.
 * Выезжает и уезжает анимацией; при закрытии ждём конца анимации и только потом закрываем dialog.
 */
function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const root = document.documentElement;
    if (open) {
      if (!dialog.open) dialog.showModal();
      root.classList.add('scroll-locked');
      const frame = requestAnimationFrame(() => (dialog.dataset.state = 'open'));
      return () => cancelAnimationFrame(frame);
    }
    dialog.dataset.state = 'closed';
    root.classList.remove('scroll-locked');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => dialog.open && dialog.close(), reduce ? 0 : 280);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      className="sheet md:hidden"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex items-center justify-between gap-4 px-4 pb-2 pt-3">
        <p className="font-display text-2xl">{title}</p>
        <button type="button" onClick={onClose} aria-label={t('common.close')} className="press -mr-2 flex h-11 w-11 items-center justify-center rounded-full text-xl text-ink-2">
          ×
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
      <div className="flex gap-2 border-t border-line bg-surface px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>
    </dialog>
  );
}

