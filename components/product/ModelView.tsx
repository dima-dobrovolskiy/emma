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
  bonusPopup: boolean;
};

export function ModelView({ modelSlug, modelName, lineLabel, variants, defaultSlug, badge, pricesDate, ratingSlot, bonusPopup }: Props) {
  // Расцветка: выбор пользователя → ?color= из адреса → расцветка по умолчанию.
  const urlColor = useUrlParam('color');
  const [picked, setPicked] = useState<string | null>(null);
  const slug = picked ?? (urlColor && variants.some((x) => x.designSlug === urlColor) ? urlColor : defaultSlug);
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
      setPicked(next.designSlug);
      setUrlParams({ color: next.designSlug });
      track('variant_select', { model: modelSlug, variant: next.designSlug, kaspiCode: next.kaspiCode });
    },
    [modelSlug],
  );

  const onBuy = (placement: string) => {
    track('kaspi_click', { model: modelSlug, variant: v.designSlug, kaspiCode: v.kaspiCode, price: v.price, placement });
    if (bonusPopup) setPopup(true);
  };

  const variantTitle = t('model.variantName', { line: lineLabel, design: v.designName });
  const credit = v.creditMonthlyPrice;

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-10">
      <Gallery key={v.kaspiCode} images={v.images} alt={variantTitle} badge={badge} />

      <div className="md:pt-2">
        <h1 className="text-[1.75rem] leading-tight md:text-[2.25rem]">
          {modelName}
          {variants.length > 1 && <span className="mt-1 block font-sans text-base font-normal text-ink-2 md:text-lg">{t('model.colorSelected', { name: v.designName })}</span>}
        </h1>
        {ratingSlot && <div className="mt-3">{ratingSlot}</div>}

        <div className="mt-5 rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
            <p className="text-[2rem] font-semibold leading-none">{formatPrice(v.price)}</p>
            {v.priceBeforeDiscount > v.price && (
              <p className="text-ink-3 line-through" aria-label={t('buy.priceWas', { price: formatPrice(v.priceBeforeDiscount) })}>
                {formatPrice(v.priceBeforeDiscount)}
              </p>
            )}
          </div>
          {credit && (
            <p className="mt-3 text-lg">
              <span className="rounded-lg bg-sage-soft px-2 py-0.5 font-semibold text-sage">{t('buy.credit', { amount: credit })}</span>
              {v.creditMonths && <span className="ml-2 text-sm text-ink-2">{t('buy.creditTerm', { amount: credit, months: v.creditMonths })}</span>}
            </p>
          )}
          {v.bonus > 0 && <p className="mt-2 text-sm text-ink-2">{t('buy.bonus', { amount: formatPrice(v.bonus) })}</p>}

          {variants.length > 1 && (
            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-semibold">
                {t('model.color')}: <span className="font-normal text-ink-2">{v.designName}</span>
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('model.color')}>
                {variants.map((x) => {
                  const active = x.designSlug === v.designSlug;
                  return (
                    <button
                      key={x.kaspiCode}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={x.inStock ? x.designName : t('model.colorUnavailable', { name: x.designName })}
                      title={x.designName}
                      onClick={() => select(x)}
                      className={`relative h-14 w-11 overflow-hidden rounded-xl border-2 bg-sand transition ${
                        active ? 'border-ink' : 'border-transparent hover:border-line'
                      } ${x.inStock ? '' : 'opacity-50 grayscale'}`}
                    >
                      {swatchImages && x.images[0] && (
                        <img src={x.images[0].swatch} alt="" width={44} height={56} decoding="async" className="h-full w-full object-cover" />
                      )}
                      {!x.inStock && <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,transparent_47%,var(--color-ink-3)_48%,var(--color-ink-3)_52%,transparent_53%)]" />}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div ref={buyRef} className="mt-5">
            <BuyLink v={v} onClick={() => onBuy('main')} className="w-full text-lg" />
            <p className="mt-2 text-center text-sm text-ink-3">{t('buy.note')}</p>
          </div>
          <p className="mt-4 text-xs text-ink-3">{t('common.pricesActual', { date: pricesDate })}</p>
        </div>
      </div>

      {/* Липкая панель на мобильном: цена + кнопка, когда основная кнопка ушла с экрана. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[var(--shadow-bar)] backdrop-blur transition-transform md:hidden ${
          buyVisible ? 'translate-y-full' : 'translate-y-0'
        }`}
        aria-hidden={buyVisible}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-ink-3">{v.designName}</p>
            <p className="text-lg font-semibold leading-tight">{formatPrice(v.price)}</p>
            {credit && <p className="text-xs text-sage">{t('buy.credit', { amount: credit })}</p>}
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
    </a>
  );
}
