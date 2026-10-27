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
    <section aria-labelledby="what-to-buy" className="not-prose my-10">
      <h2 id="what-to-buy" className="mb-4 text-2xl md:text-3xl">
        {t('guides.whatToBuy')}
      </h2>
      <ul className="grid gap-3 md:grid-cols-3">
        {picks.map((p) => {
          const img = p.model.defaultVariant.images[0];
          return (
            <li key={p.kind} className="card relative flex gap-3 p-3 md:flex-col md:p-4">
              {img && (
                <img {...cardSrcSet(img)} sizes="(min-width: 768px) 240px, 96px" alt={p.model.name} width={370} height={493} loading="lazy" className="h-32 w-24 shrink-0 rounded-xl object-cover md:h-auto md:w-full md:aspect-[3/4]" />
              )}
              <div>
                <p className="eyebrow">{t(KIND_KEY[p.kind])}</p>
                <p className="mt-1 font-semibold">
                  <GuideModelLink guide={guide} model={p.model.slug} className="after:absolute after:inset-0 hover:text-accent">
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
    <section aria-labelledby="compare" className="not-prose my-10">
      <h2 id="compare" className="mb-4 text-2xl md:text-3xl">
        {t('guides.compareTitle')}
      </h2>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="bg-sand text-ink-2">
            <tr>
              <th scope="col" className="px-4 py-3">{t('guides.colModel')}</th>
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
                <th scope="row" className="px-4 py-3 font-semibold">
                  <GuideModelLink guide={guide} model={r.m.slug} className="hover:text-accent">
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
      <p className="mt-2 text-xs text-ink-3">{t('guides.tableNote', { date: formatDate(date) })}</p>
    </section>
  );
}

export function ReviewQuotes({ models }: { models: Model[] }) {
  const quotes = reviewQuotes(models, 4);
  if (!quotes.length) return null;
  return (
    <section aria-labelledby="quotes" className="not-prose my-10">
      <h2 id="quotes" className="mb-4 text-2xl md:text-3xl">
        {t('guides.quotesTitle')}
      </h2>
      <ul className="grid gap-3 md:grid-cols-2">
        {quotes.map((q) => (
          <li key={q.id} className="rounded-[var(--radius-card)] bg-sand p-5">
            <blockquote>
              <p>«{q.text}»</p>
              <footer className="mt-3 text-sm text-ink-3">
                {q.author} · {q.modelName}, {q.designName} · {'★'.repeat(q.rating)}
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
    <section aria-labelledby="guide-models" className="not-prose my-10">
      <h2 id="guide-models" className="mb-4 text-2xl md:text-3xl">
        {t('guides.modelsTitle')}
      </h2>
      <ul className="space-y-2">
        {models.map((m) => (
          <li key={m.slug}>
            <GuideModelLink guide={guide} model={m.slug} className="flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 hover:border-ink-3">
              <span className="font-semibold">{m.name}</span>
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
