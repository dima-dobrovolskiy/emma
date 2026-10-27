'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatPrice, t } from '@/lib/i18n';
import { fmtRatingClient } from '@/lib/format';
import { track } from '@/lib/analytics/events';
import { podbor, type AgeOption, type PodborModel, type WeightOption, type Where } from '@/lib/podbor-rules';

type Props = {
  ages: AgeOption[];
  weights: WeightOption[];
  where: Where[];
  models: PodborModel[];
  addons: PodborModel[];
  maxResults: number;
  ageLabels: Record<string, string>;
  ageRangeLabels: Record<string, string>;
  images: Record<string, string>;
};

export function Quiz({ ages, weights, where, models, addons, maxResults, ageLabels, ageRangeLabels, images }: Props) {
  const [step, setStep] = useState(0);
  const [age, setAge] = useState<AgeOption | null>(null);
  const [weight, setWeight] = useState<WeightOption | null>(null);
  const [place, setPlace] = useState<Where | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('age');
    const a = ages.find((x) => x.id === id);
    if (a) {
      setAge(a);
      setStep(1);
      setStarted(true);
      track('quiz_start', {});
    }
  }, [ages]);

  const start = () => {
    if (!started) {
      setStarted(true);
      track('quiz_start', {});
    }
  };

  const result = age && weight && place ? podbor(models, addons, { age, weight, where: place }, maxResults) : null;

  useEffect(() => {
    if (result) track('quiz_complete', { result: result.main.map((m) => m.slug).join(',') || 'none' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [age?.id, weight?.id, place]);

  const restart = () => {
    setAge(null);
    setWeight(null);
    setPlace(null);
    setStep(0);
  };

  if (result) {
    return (
      <div aria-live="polite">
        <h2 className="text-2xl md:text-3xl">{t('podbor.resultTitle')}</h2>
        <p className="mt-2 text-sm text-ink-3">{t('podbor.resultLead')}</p>
        {result.main.length === 0 ? (
          <p className="mt-6 rounded-[var(--radius-card)] bg-sand p-5">{t('podbor.nothing')}</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {[...result.main, ...result.winterAddon].map((m, i) => {
              const isAddon = i >= result.main.length;
              const reasons = isAddon
                ? [t('podbor.winterAddon')]
                : [
                    ageRangeLabels[m.slug] && t('podbor.reasonAge', { range: ageRangeLabels[m.slug]! }),
                    m.weightTo !== null && t('podbor.reasonWeight', { max: m.weightTo }),
                    place && m.uses.includes(place) && t('podbor.reasonWhere', { text: t(`podbor.where-${place}`) }),
                    m.reviews > 0 && m.rating !== null && t('podbor.reasonPopular', { reviews: t('common.reviewsCount', { count: m.reviews }), rating: fmtRatingClient(m.rating) }),
                  ].filter((x): x is string => Boolean(x));
              return (
                <li key={m.slug} className="card relative flex gap-4 p-4">
                  {images[m.slug] && <img src={images[m.slug]} alt="" width={96} height={128} className="h-32 w-24 shrink-0 rounded-xl object-cover" />}
                  <div className="min-w-0">
                    {isAddon && <p className="eyebrow">{t('podbor.winterAddon')}</p>}
                    <p className="text-lg font-semibold">
                      <Link href={`/p/${m.slug}`} className="after:absolute after:inset-0 hover:text-accent">
                        {m.name}
                      </Link>
                    </p>
                    <p className="font-semibold">
                      {t('common.from')} {formatPrice(m.minPrice)}
                    </p>
                    {!isAddon && (
                      <>
                        <p className="mt-2 text-sm font-semibold text-ink-2">{t('podbor.why')}:</p>
                        <ul className="mt-1 list-disc pl-5 text-sm text-ink-2">
                          {reasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <button type="button" onClick={restart} className="btn btn-secondary mt-6">
          {t('podbor.restart')}
        </button>
      </div>
    );
  }

  const steps = [
    {
      q: t('podbor.qAge'),
      options: ages.map((a) => ({ id: a.id, label: ageLabels[a.id] ?? a.id, active: age?.id === a.id, pick: () => (start(), setAge(a), setStep(1)) })),
    },
    {
      q: t('podbor.qWeight'),
      options: weights.map((w) => ({ id: w.id, label: t(`podbor.weight-${w.id}` as 'podbor.weight-0-7'), active: weight?.id === w.id, pick: () => (setWeight(w), setStep(2)) })),
    },
    {
      q: t('podbor.qWhere'),
      options: where.map((w) => ({ id: w, label: t(`podbor.where-${w}`), active: place === w, pick: () => setPlace(w) })),
    },
  ];
  const s = steps[step]!;
  return (
    <div>
      <p className="eyebrow">{t('podbor.step', { current: step + 1, total: steps.length })}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-2">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>
      <fieldset className="mt-6">
        <legend className="text-2xl font-semibold md:text-3xl">{s.q}</legend>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {s.options.map((o) => (
            <button key={o.id} type="button" onClick={o.pick} aria-pressed={o.active} className="chip min-h-[56px] justify-start px-5 text-base font-semibold">
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>
      {step > 0 && (
        <button type="button" onClick={() => setStep(step - 1)} className="mt-6 inline-flex min-h-[44px] items-center text-ink-2 underline underline-offset-4">
          {t('podbor.back')}
        </button>
      )}
    </div>
  );
}
