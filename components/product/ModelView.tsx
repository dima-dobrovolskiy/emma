'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { setUrlParams, usePageLoaded, useUrlParam } from '@/lib/hooks';
import type { GalleryImage } from '@/lib/media-types';
import { formatPrice, t } from '@/lib/i18n';
import { track } from '@/lib/analytics/events';
import { Gallery } from './Gallery';
import { BonusPopup } from './BonusPopup';

export type ViewVariant = {
  kaspiCode: string;
  designSlug: string;
  designName: string;
  inStock: boolean;
  price: number;
  priceBeforeDiscount: number;
  creditMonthlyPrice: string | null;
  creditMonths: number | null;
  bonus: number;
  buyHref: string;
  images: GalleryImage[];
};

type Props = {
  modelSlug: string;
  modelName: string;
  lineLabel: string;
  variants: ViewVariant[];
  defaultSlug: string;
  badge: string | null;
  pricesDate: string;
  ratingSlot?: React.ReactNode;
  /** «Магазин SlingoEmma на Kaspi: 4 года, 10 000+ заказов, оценка 4,9» - из синхронизации. */
  trustLine?: string;
  bonusPopup: boolean;
};

export function ModelView({ modelSlug, modelName, lineLabel, variants, defaultSlug, badge, pricesDate, ratingSlot, trustLine, bonusPopup }: Props) {
  // Расцветка живёт в адресе (?color=), иначе - расцветка по умолчанию. Свотчи и список «Все расцветки» меняют только адрес.
  const urlColor = useUrlParam('color');
  const slug = urlColor && variants.some((x) => x.designSlug === urlColor) ? urlColor : defaultSlug;
  // Анимация смены фото и цены - только после выбора, не при загрузке страницы.
  const [picked, setPicked] = useState(false);
  const [initialSlug] = useState(slug);
  if (!picked && slug !== initialSlug) setPicked(true);
  const [popup, setPopup] = useState(false);
  const [buyVisible, setBuyVisible] = useState(true);
  // Миниатюры расцветок грузим после главного фото: на мобильном 16 картинок иначе отбирают канал у первого экрана.
  const swatchImages = usePageLoaded();
  const buyRef = useRef<HTMLDivElement>(null);
  const v = useMemo(() => variants.find((x) => x.designSlug === slug) ?? variants[0]!, [slug, variants]);

  useEffect(() => {
    const el = buyRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setBuyVisible(Boolean(e?.isIntersecting)), { rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const select = useCallback(
    (next: ViewVariant) => {
      setUrlParams({ color: next.designSlug });
      track('variant_select', { model: modelSlug, variant: next.designSlug, kaspiCode: next.kaspiCode });
    },
    [modelSlug],
  );

  const onSwatchKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const i = variants.findIndex((x) => x.designSlug === v.designSlug);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? variants.length - 1 : step !== undefined ? (i + step + variants.length) % variants.length : null;
    if (next === null) return;
    e.preventDefault();
    const target = variants[next]!;
    select(target);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-slug="${target.designSlug}"]`)?.focus();
  };

  const onBuy = (placement: string) => {
    track('kaspi_click', { model: modelSlug, variant: v.designSlug, kaspiCode: v.kaspiCode, price: v.price, placement });
    if (bonusPopup) setPopup(true);
  };

  const variantTitle = t('model.variantName', { line: lineLabel, design: v.designName });
  const credit = v.creditMonthlyPrice;

  return (
    <div id="model-view" className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-10">
      <Gallery key={v.kaspiCode} images={v.images} alt={variantTitle} badge={badge} swapped={picked} />

      <div className="md:pt-2">
        <h1 className="text-[2rem] leading-[1.08] md:text-[2.625rem]">{modelName}</h1>
        {variants.length > 1 && <p className="mt-2 text-ink-3">{t('model.colorSelected', { name: v.designName })}</p>}
        {ratingSlot && <div className="mt-2">{ratingSlot}</div>}

        <div className="mt-6 border-t border-line pt-6">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p key={v.kaspiCode} className={`text-[2.125rem] font-semibold leading-none tabular-nums ${picked ? 'swap-in' : ''}`}>
              {formatPrice(v.price)}
            </p>
            {v.priceBeforeDiscount > v.price && (
              <p className="text-ink-3">
                <span className="sr-only">{t('buy.priceWasLabel')} </span>
                <del>{formatPrice(v.priceBeforeDiscount)}</del>
              </p>
            )}
          </div>
          {credit && (
            <p className="mt-2 flex flex-wrap items-baseline gap-x-3">
              <span className="text-xl font-semibold text-accent">{t('buy.credit', { amount: credit })}</span>
              {v.creditMonths && <span className="text-[0.9375rem] text-ink-2">{t('buy.creditTerm', { amount: credit, months: v.creditMonths })}</span>}
            </p>
          )}
          {v.bonus > 0 && <p className="mt-1 text-[0.9375rem] text-ink-2">{t('buy.bonus', { amount: formatPrice(v.bonus) })}</p>}

          {variants.length > 1 && (
            <div className="mt-6">
              <p id={`${modelSlug}-color`} className="mb-3 text-[0.9375rem] font-semibold">
                {t('model.color')}: <span className="font-normal text-ink-2">{v.designName}</span>
              </p>
              {/* Радиогруппа: в табуляции одна выбранная расцветка, стрелки переключают (как у нативных радиокнопок). */}
              <div className="flex flex-wrap gap-3 p-0.5" role="radiogroup" aria-labelledby={`${modelSlug}-color`} onKeyDown={onSwatchKey}>
                {variants.map((x) => {
                  const active = x.designSlug === v.designSlug;
                  return (
                    <button
                      key={x.kaspiCode}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      tabIndex={active ? 0 : -1}
                      data-slug={x.designSlug}
                      aria-label={x.inStock ? x.designName : t('model.colorUnavailable', { name: x.designName })}
                      title={x.designName}
                      onClick={() => select(x)}
                      className={`press relative h-11 w-11 overflow-hidden rounded-full bg-sand-2 ring-offset-2 ring-offset-bg transition-[box-shadow,transform] duration-200 ${
                        active ? 'ring-2 ring-ink' : 'ring-1 ring-line hover:ring-line-strong'
                      } ${x.inStock ? '' : 'opacity-40'}`}
                    >
                      {swatchImages && x.images[0] && (
                        <img src={x.images[0].swatch} alt="" width={44} height={44} decoding="async" className="swatch-crop h-full w-full object-cover" />
                      )}
                      {!x.inStock && <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-px w-[130%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-ink-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {picked ? t('model.announce', { name: v.designName, price: formatPrice(v.price) }) : ''}
          </p>

          <div ref={buyRef} className="mt-7">
            <BuyLink v={v} onClick={() => onBuy('main')} className="min-h-14 w-full text-lg" />
            <p className="mt-2.5 text-center text-sm text-ink-3">{t('buy.note')}</p>
          </div>
          {trustLine && <p className="mt-5 border-t border-line pt-4 text-[0.9375rem] text-ink-2">{trustLine}</p>}
          <p className="mt-2 text-sm text-ink-3">{t('common.pricesActual', { date: pricesDate })}</p>
        </div>
      </div>

      {/* Липкая панель на мобильном: цена + кнопка, когда основная кнопка ушла с экрана. */}
      <div
        data-sticky-buy
        className={`fixed inset-x-0 bottom-0 z-30 bg-surface px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[var(--shadow-bar)] transition-transform duration-300 ease-out md:hidden ${
          buyVisible ? 'translate-y-full' : 'translate-y-0'
        }`}
        aria-hidden={buyVisible}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8125rem] text-ink-3">{v.designName}</p>
            <p className="text-lg font-semibold leading-tight">{formatPrice(v.price)}</p>
            {credit && <p className="text-sm font-semibold text-accent">{t('buy.credit', { amount: credit })}</p>}
          </div>
          <BuyLink v={v} onClick={() => onBuy('sticky')} className="shrink-0 px-5" tabIndex={buyVisible ? -1 : 0} />
        </div>
      </div>

      {bonusPopup && popup && <BonusPopup onClose={() => setPopup(false)} />}
    </div>
  );
}

function BuyLink({ v, onClick, className = '', tabIndex }: { v: ViewVariant; onClick: () => void; className?: string; tabIndex?: number }) {
  return (
    <a
      href={v.buyHref}
      target="_blank"
      rel="noopener"
      onClick={onClick}
      tabIndex={tabIndex}
      className={`btn ${v.inStock ? 'btn-primary' : 'btn-secondary'} ${className}`}
      data-kaspi-code={v.kaspiCode}
    >
      {v.inStock ? t('buy.button') : t('buy.unavailableButton')}
      <span className="sr-only"> ({t('buy.newTab')})</span>
    </a>
  );
}
