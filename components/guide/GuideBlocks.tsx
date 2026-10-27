import type { Model } from '@/lib/catalog';
import { specValues } from '@/lib/catalog';
import { formatDate, formatPrice, t } from '@/lib/i18n';
import { fmtRatingClient } from '@/lib/format';
import { maxWeightKg, productWeight, creditText } from '@/lib/summary';
import { whatToBuy, reviewQuotes } from '@/lib/guide-data';
import { cardSrcSet } from '@/lib/images';
import { prettyAge } from '@/lib/text';
import { GuideModelLink } from './TrackedLink';

const KIND_KEY = { cheapest: 'guides.cheapest', popular: 'guides.popular', equipped: 'guides.equipped' } as const;

export function WhatToBuy({ models, guide }: { models: Model[]; guide: string }) {
  const picks = whatToBuy(models);
  return (
    <section aria-labelledby="what-to-buy" className="not-prose my-14">
      <h2 id="what-to-buy" className="h-section mb-6">
        {t('guides.whatToBuy')}
      </h2>
      <ul className="grid gap-6 md:grid-cols-3 md:gap-5">
        {picks.map((p) => {
          const img = p.model.defaultVariant.images[0];
          return (
            <li key={p.kind} className="lift group relative flex gap-4 md:flex-col">
              {img && (
                <span className="skeleton block h-32 w-24 shrink-0 overflow-hidden rounded-[var(--radius-card)] md:aspect-[3/4] md:h-auto md:w-full">
                  <img {...cardSrcSet(img)} sizes="(min-width: 768px) 240px, 96px" alt="" width={370} height={493} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                </span>
              )}
              <div>
                <p className="text-[0.9375rem] font-semibold text-accent">{t(KIND_KEY[p.kind])}</p>
                <p className="mt-1 font-semibold">
                  <GuideModelLink guide={guide} model={p.model.slug} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
                    {p.model.name}
                  </GuideModelLink>
                </p>
                <p className="mt-1 text-sm text-ink-2">{p.reason}</p>
                <p className="mt-2 font-semibold">
                  {p.model.minPrice === p.model.maxPrice ? formatPrice(p.model.minPrice) : `${t('common.from')} ${formatPrice(p.model.minPrice)}`}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function CompareTable({ models, guide, date }: { models: Model[]; guide: string; date: string }) {
  const rows = models.map((m) => ({
    m,
    age: prettyAge(specValues(m.variants, 'Рекомендуемый возраст ребенка')[0] ?? t('guides.dash')),
    maxW: maxWeightKg(m),
    credit: creditText(m),
    features: specValues(m.variants, 'Особенности').join(', ') || t('guides.dash'),
    belt: specValues(m.variants, 'Поясной ремень')[0],
    weight: productWeight(m),
  }));
  return (
    <section aria-labelledby="compare" className="not-prose my-14">
      <h2 id="compare" className="h-section mb-6">
        {t('guides.compareTitle')}
      </h2>
      <div tabIndex={0} role="region" aria-labelledby="compare" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-ink/20 text-[0.8125rem] text-ink-3">
            <tr>
              <th scope="col" className="sticky left-0 z-[1] bg-bg px-4 py-3 pl-0">{t('guides.colModel')}</th>
              <th scope="col" className="px-4 py-3">{t('guides.colPrice')}</th>
              <th scope="col" className="px-4 py-3">{t('guides.colCredit')}</th>
              <th scope="col" className="px-4 py-3">{t('guides.colRating')}</th>
              <th scope="col" className="px-4 py-3">{t('guides.colAge')}</th>
              <th scope="col" className="px-4 py-3">{t('guides.colWeight')}</th>
              <th scope="col" className="px-4 py-3">{t('guides.colCarry')}</th>
              <th scope="col" className="px-4 py-3">{t('guides.colBelt')}</th>
              <th scope="col" className="px-4 py-3">{t('guides.colFeatures')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.m.slug}>
                <th scope="row" className="sticky left-0 z-[1] bg-bg px-4 py-3 pl-0 font-semibold shadow-[1px_0_0_var(--color-line)]">
                  <GuideModelLink guide={guide} model={r.m.slug} className="inline-flex min-h-11 items-center hover:text-accent">
                    {r.m.name}
                  </GuideModelLink>
                </th>
                <td className="px-4 py-3 whitespace-nowrap">{r.m.minPrice === r.m.maxPrice ? formatPrice(r.m.minPrice) : `${t('common.from')} ${formatPrice(r.m.minPrice)}`}</td>
                <td className="px-4 py-3 whitespace-nowrap">{r.credit ?? t('guides.dash')}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {r.m.ratingAvg !== null ? `${fmtRatingClient(r.m.ratingAvg)} · ${t('common.reviewsCount', { count: r.m.reviewsCount })}` : t('guides.dash')}
                </td>
                <td className="px-4 py-3">{r.age}</td>
                <td className="px-4 py-3 whitespace-nowrap">{r.maxW !== null ? t('summary.kg', { value: r.maxW }) : t('guides.dash')}</td>
                <td className="px-4 py-3">{r.m.carryPositions.join(', ') || t('guides.dash')}</td>
                <td className="px-4 py-3">{r.belt ?? t('guides.dash')}</td>
                <td className="px-4 py-3">{r.features}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-ink-3">{t('guides.tableNote', { date: formatDate(date) })}</p>
    </section>
  );
}

export function ReviewQuotes({ models }: { models: Model[] }) {
  const quotes = reviewQuotes(models, 4);
  if (!quotes.length) return null;
  return (
    <section aria-labelledby="quotes" className="not-prose my-14">
      <h2 id="quotes" className="h-section mb-6">
        {t('guides.quotesTitle')}
      </h2>
      <ul className="grid gap-x-10 gap-y-6 md:grid-cols-2">
        {quotes.map((q) => (
          <li key={q.id} className="border-t border-line pt-5">
            <blockquote>
              <p>«{q.text}»</p>
              <footer className="mt-3 text-sm text-ink-3">
                {q.author} · {q.modelName}, {q.designName} ·{' '}
                <span role="img" aria-label={t('common.ratingOutOf', { rating: q.rating })} className="text-star">
                  {'★'.repeat(q.rating)}
                </span>
              </footer>
            </blockquote>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GuideModels({ models, guide }: { models: Model[]; guide: string }) {
  return (
    <section aria-labelledby="guide-models" className="not-prose my-14">
      <h2 id="guide-models" className="h-section mb-6">
        {t('guides.modelsTitle')}
      </h2>
      <ul className="divide-y divide-line border-y border-line">
        {models.map((m) => (
          <li key={m.slug}>
            <GuideModelLink guide={guide} model={m.slug} className="group flex min-h-14 items-center justify-between gap-3 py-3">
              <span className="font-semibold group-hover:underline group-hover:underline-offset-4">{m.name}</span>
              <span className="text-sm text-ink-2">
                {t('common.from')} {formatPrice(m.minPrice)}
              </span>
            </GuideModelLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
