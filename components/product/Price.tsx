import { formatPrice, t } from '@/lib/i18n';
import { discountPercent, installmentTerm, type PriceInfo } from '@/lib/price';

/** Метки как на Kaspi: «-11%» и «0·0·12». Обе - только если следуют из данных. */
export function PriceBadges({ p, className = '' }: { p: PriceInfo; className?: string }) {
  const off = discountPercent(p);
  const term = installmentTerm(p);
  if (!off && !term) return null;
  return (
    <p className={`flex flex-wrap gap-1 text-[0.8125rem] font-bold leading-none tabular-nums ${className}`}>
      {off > 0 && (
        <span className="rounded-[0.3125rem] bg-kaspi px-1.5 py-1 text-kaspi-ink">
          <span className="sr-only">{t('buy.discountSr')} </span>−{off}%
        </span>
      )}
      {term && (
        <span className="rounded-[0.3125rem] bg-kaspi-yellow px-1.5 py-1 text-ink">
          <span className="sr-only">{t('buy.installmentSr')} </span>
          {t('buy.installmentBadge', { months: term })}
        </span>
      )}
    </p>
  );
}

/** Действующая цена красным, рядом зачёркнутая цена до скидки. */
export function PriceLine({ p, from = false, size, className = '' }: { p: PriceInfo; from?: boolean; size: string; className?: string }) {
  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 leading-tight tabular-nums ${className}`}>
      <span className={`font-semibold text-kaspi-text ${size}`}>
        {from && `${t('common.from')} `}
        {formatPrice(p.price)}
      </span>
      {p.priceBeforeDiscount > p.price && (
        <span className="text-ink-3">
          <span className="sr-only">{t('buy.priceWasLabel')} </span>
          <del>{formatPrice(p.priceBeforeDiscount)}</del>
        </span>
      )}
    </p>
  );
}

/** Плашка на фото, как у витрин Kaspi: «Kaspi 0-0-12 2 575 ₸/мес». */
export function KaspiCreditPill({ p, className = '' }: { p: PriceInfo; className?: string }) {
  if (!p.creditMonthlyPrice) return null;
  const term = installmentTerm(p);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-surface py-1 pl-1 pr-3 text-[0.8125rem] leading-none tabular-nums shadow-[0_2px_10px_rgb(28_27_25/0.12)] ${className}`}>
      <span className="rounded-full bg-kaspi px-2 py-1 font-semibold text-kaspi-ink">{t('buy.kaspi')}</span>
      {term && <span className="font-bold text-kaspi-text">{t('buy.installmentPill', { months: term })}</span>}
      <span className="font-semibold text-ink">{t('buy.perMonth', { amount: p.creditMonthlyPrice })}</span>
    </span>
  );
}
