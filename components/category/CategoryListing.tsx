'use client';

import { useMemo } from 'react';
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

  return (
    <div>
      {(visibleGroups.length > 0 || items.length > 2) && (
        <details className="group mb-6 rounded-[var(--radius-card)] border border-line bg-surface md:open:pb-2" open={false}>
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 font-semibold [&::-webkit-details-marker]:hidden">
            <span>
              {t('category.filtersShow')}
              {active && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-ink">{Object.values(f).filter(Boolean).length}</span>}
            </span>
            <span aria-hidden="true" className="text-ink-3 transition group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="space-y-4 px-4 pb-4">
            {visibleGroups.map((g) => (
              <fieldset key={g.key}>
                <legend className="mb-2 text-sm font-semibold text-ink-2">{g.label}</legend>
                <div className="flex flex-wrap gap-2">
                  {g.values.map((v) => (
                    <button key={v.id} type="button" className="chip" aria-pressed={f[g.key] === v.id} onClick={() => update(g.key, f[g.key] === v.id ? '' : v.id)}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-ink-2">{t('category.sort')}</legend>
              <div className="flex flex-wrap gap-2">
                {SORTS.map((s) => (
                  <button key={s.id} type="button" className="chip" aria-pressed={sort === s.id} onClick={() => update('sort', s.id === 'popular' ? '' : s.id)}>
                    {t(s.key)}
                  </button>
                ))}
              </div>
            </fieldset>
            {active && (
              <button type="button" className="btn btn-secondary min-h-[44px] text-sm" onClick={() => {
                  setUrlParams(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, null])));
                  track('filter_use', { filter: 'all', value: 'reset', page });
                }}>
                {t('category.filtersReset')}
              </button>
            )}
          </div>
        </details>
      )}

      <p className="mb-3 text-sm text-ink-3" aria-live="polite">
        {t('category.found', { count: shown.length })}
      </p>
      {shown.length === 0 ? (
        <p className="rounded-[var(--radius-card)] bg-sand p-5">{t('category.empty')}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {shown.map((i) => (
            <li key={i.slug}>{cards[i.slug]}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
