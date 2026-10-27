import Link from 'next/link';
import type { Model } from '@/lib/catalog';
import { formatPrice, t } from '@/lib/i18n';
import { cardSrcSet, thumbSrc } from '@/lib/images';
import { maxWeightKg } from '@/lib/summary';
import { Stars } from '@/components/ui/Stars';

const MAX_SWATCHES = 5;

export function ModelCard({ model, priority = false, headingLevel = 3 }: { model: Model; priority?: boolean; headingLevel?: 2 | 3 }) {
  const v = model.defaultVariant;
  const img = v.images[0];
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const maxW = maxWeightKg(model);
  return (
    <article className="card group relative flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[3/4] overflow-hidden bg-sand">
        {img && (
          <img
            {...cardSrcSet(img)}
            sizes="(min-width: 1024px) 280px, (min-width: 768px) 33vw, 50vw"
            alt={t('model.variantName', { line: model.lineLabel, design: v.designName })}
            width={370}
            height={493}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {model.isHit && <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-bg">{t('common.hit')}</span>}
          {model.hasDiscount && <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-ink">{t('common.sale')}</span>}
          {model.inStockCount === 0 && (
            <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink-2">{t('common.outOfStock')}</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 md:p-4">
        <H className="font-sans text-[0.98rem] font-semibold leading-snug md:text-[1.05rem]">
          <Link href={`/p/${model.slug}`} className="after:absolute after:inset-0">
            {model.name}
          </Link>
        </H>
        {maxW !== null && <p className="text-xs text-ink-3">{t('category.weightUpTo', { value: maxW })}</p>}
        <Stars rating={model.ratingAvg} count={model.ratingCount ? model.reviewsCount : undefined} />
        <div className="mt-auto pt-1">
          <p className="text-lg font-semibold leading-tight">
            {model.minPrice === model.maxPrice ? formatPrice(model.minPrice) : `${t('common.from')} ${formatPrice(model.minPrice)}`}
          </p>
          {v.creditMonthlyPrice && (
            <p className="text-sm text-sage">
              {v.creditMonths ? t('buy.creditShort', { amount: v.creditMonthlyPrice, months: v.creditMonths }) : v.creditMonthlyPrice}
            </p>
          )}
        </div>
        {model.variants.length > 1 && (
          <div className="flex items-center gap-1.5 pt-1">
            <span className="flex -space-x-1.5" aria-hidden="true">
              {model.variants.slice(0, MAX_SWATCHES).map((x) => (
                <span key={x.kaspiCode} className={`block h-6 w-6 overflow-hidden rounded-full border-2 border-surface bg-sand ${x.inStock ? '' : 'opacity-40 grayscale'}`}>
                  {x.images[0] && <img src={thumbSrc(x.images[0])} alt="" width={24} height={24} loading="lazy" className="h-full w-full object-cover" />}
                </span>
              ))}
            </span>
            <span className="text-xs text-ink-3">{t('common.colorsCount', { count: model.variants.length })}</span>
          </div>
        )}
      </div>
    </article>
  );
}
