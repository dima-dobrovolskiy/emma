'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useUrlParam } from '@/lib/hooks';
import { formatPrice, t } from '@/lib/i18n';
import { fmtRatingClient } from '@/lib/format';
import { track } from '@/lib/analytics/events';
import { highlights, podbor, type AgeOption, type PodborModel, type WeightOption, type Where } from '@/lib/podbor-rules';

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
  // ?age= с главной: первый ответ уже дан. После «Пройти заново» адрес не учитываем.
  const urlAgeId = useUrlParam('age');
  const [useUrl, setUseUrl] = useState(true);
  const [ageId, setAgeId] = useState<string | null>(null);
  const [weightId, setWeightId] = useState<string | null>(null);
  const [place, setPlace] = useState<Where | null>(null);
  const [started, setStarted] = useState(false);

  const age = ages.find((x) => x.id === (ageId ?? (useUrl ? urlAgeId : null))) ?? null;
  const weight = weights.find((x) => x.id === weightId) ?? null;
  const step = !age ? 0 : !weight ? 1 : 2;
  const result = age && weight && place ? podbor(models, addons, { age, weight, where: place }, maxResults) : null;

  // После каждого ответа фокус - на новый вопрос или на заголовок результата, чтобы скринридер прочитал его.
  const focusTarget = useRef<HTMLElement>(null);
  const answered = useRef(false);
  const view = result ? 'result' : `step-${step}`;
  useEffect(() => {
    if (answered.current) focusTarget.current?.focus({ preventScroll: true });
  }, [view]);

  const start = () => {
    answered.current = true;
    if (!started) {
      setStarted(true);
      track('quiz_start', {});
    }
  };

  const finish = (p: Where) => {
    start();
    setPlace(p);
    if (age && weight) {
      const r = podbor(models, addons, { age, weight, where: p }, maxResults);
      track('quiz_complete', { result: r.main.map((m) => m.slug).join(',') || 'none' });
    }
  };

  const back = () => {
    answered.current = true;
    if (step === 2) setWeightId(null);
    else if (step === 1) {
      setAgeId(null);
      setUseUrl(false);
    }
  };

  const restart = () => {
    answered.current = true;
    setAgeId(null);
    setWeightId(null);
    setPlace(null);
    setUseUrl(false);
  };

  if (result) {
    const marks = highlights(result.main);
    const markText = (m: PodborModel) => {
      switch (marks.get(m.slug)) {
        case 'birth':
          return t('podbor.highlightBirth');
        case 'weight':
          return t('podbor.highlightWeight', { max: (m.shownMaxKg ?? m.weightTo)! });
        case 'popular':
          return t('podbor.highlightPopular', { reviews: t('common.reviewsCount', { count: m.reviews }) });
        case 'cheapest':
          return t('podbor.highlightCheapest', { price: formatPrice(m.minPrice) });
        default:
          return null;
      }
    };
    return (
      <div className="enter">
        <h2 ref={focusTarget as React.RefObject<HTMLHeadingElement>} tabIndex={-1} className="text-2xl outline-none md:text-3xl">
          {t('podbor.resultTitle')}
        </h2>
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
                    (m.shownMaxKg ?? m.weightTo) !== null && t('podbor.reasonWeight', { max: (m.shownMaxKg ?? m.weightTo)! }),
                    place && m.uses.includes(place) && t('podbor.reasonWhere', { text: t(`podbor.where-${place}`) }),
                    m.reviews > 0 && m.rating !== null && t('podbor.reasonPopular', { reviews: t('common.reviewsCount', { count: m.reviews }), rating: fmtRatingClient(m.rating) }),
                  ].filter((x): x is string => Boolean(x));
              return (
                <li key={m.slug} className="lift group enter relative flex gap-4 rounded-[var(--radius-card)] bg-surface p-4" style={{ '--i': i + 1 } as React.CSSProperties}>
                  {images[m.slug] && (
                    <span className="skeleton block h-32 w-24 shrink-0 overflow-hidden rounded-[var(--radius-card)]">
                      <img src={images[m.slug]} alt="" width={96} height={128} className="h-full w-full object-cover" />
                    </span>
                  )}
                  <div className="min-w-0">
                    {isAddon && <p className="eyebrow">{t('podbor.winterAddon')}</p>}
                    {!isAddon && markText(m) && <p className="text-sm font-semibold text-accent">{markText(m)}</p>}
                    <p className="text-lg font-semibold">
                      <Link href={`/p/${m.slug}`} prefetch={false} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
                        {m.name}
                      </Link>
                    </p>
                    <p className="font-semibold tabular-nums">
                      {t('common.from')} {formatPrice(m.minPrice)}
                      {m.credit && <span className="ml-2 text-sm text-accent">{m.credit}</span>}
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
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={restart} className="btn btn-secondary press">
            {t('podbor.restart')}
          </button>
          <button type="button" onClick={() => ((answered.current = true), setPlace(null))} className="inline-flex min-h-[44px] items-center px-2 text-ink-2 underline underline-offset-4">
            {t('podbor.back')}
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    {
      q: t('podbor.qAge'),
      options: ages.map((a) => ({ id: a.id, label: ageLabels[a.id] ?? a.id, active: age?.id === a.id, pick: () => (start(), setAgeId(a.id)) })),
    },
    {
      q: t('podbor.qWeight'),
      options: weights.map((w) => ({ id: w.id, label: t(`podbor.weight-${w.id}` as 'podbor.weight-0-7'), active: weight?.id === w.id, pick: () => (start(), setWeightId(w.id)) })),
    },
    {
      q: t('podbor.qWhere'),
      options: where.map((w) => ({ id: w, label: t(`podbor.where-${w}`), active: place === w, pick: () => finish(w) })),
    },
  ];
  const s = steps[step]!;
  return (
    <div>
      <p className="eyebrow">{t('podbor.step', { current: step + 1, total: steps.length })}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-2">
        <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>
      <fieldset key={step} className={`mt-6 ${started || step > 0 ? 'step-in' : ''}`}>
        <legend className="text-2xl font-semibold md:text-3xl">
          <span ref={focusTarget as React.RefObject<HTMLSpanElement>} tabIndex={-1} className="outline-none">
            {s.q}
          </span>
        </legend>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {s.options.map((o) => (
            <button key={o.id} type="button" onClick={o.pick} data-active={o.active} className="chip chip-light press min-h-[56px] justify-start px-5 text-base font-semibold">
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>
      {step > 0 && (
        <button type="button" onClick={back} className="mt-6 inline-flex min-h-[44px] items-center text-ink-2 underline underline-offset-4">
          {t('podbor.back')}
        </button>
      )}
    </div>
  );
}
