import Link from 'next/link';
import type { Model } from '@/lib/catalog';
import { formatPrice, t } from '@/lib/i18n';
import { cardSrcSet, thumbSrc } from '@/lib/images';
import { cheapestVariant, maxWeightKg } from '@/lib/summary';
import { Stars } from '@/components/ui/Stars';

const MAX_SWATCHES = 5;

export function ModelCard({ model, priority = false, headingLevel = 3 }: { model: Model; priority?: boolean; headingLevel?: 2 | 3 }) {
  const v = model.defaultVariant;
  const img = v.images[0];
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const maxW = maxWeightKg(model);
  const cheap = cheapestVariant(model);
  const age = model.ageRange?.from === 0 ? t('podbor.fromBirth') : model.ageRange?.from ? t('podbor.fromMonths', { count: model.ageRange.from }) : null;
  const facts = [age, maxW !== null ? t('category.weightUpTo', { value: maxW }) : null].filter(Boolean).join(' · ');
  return (
    <article className="lift group relative flex h-full flex-col">
      <div className="skeleton relative aspect-[3/4] overflow-hidden rounded-[var(--radius-card)]">
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
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5 text-[0.8125rem] font-semibold">
          {model.isHit && <span className="rounded-full bg-surface px-2.5 py-1 text-ink">{t('common.hit')}</span>}
          {model.hasDiscount && <span className="rounded-full bg-accent px-2.5 py-1 text-accent-ink">{t('common.sale')}</span>}
          {model.inStockCount === 0 && <span className="rounded-full bg-surface px-2.5 py-1 text-ink-2">{t('common.outOfStock')}</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col pt-3">
        <H className="text-[0.98rem] font-semibold leading-snug md:text-[1.05rem]">
          {/* Без префетча по появлению: иначе React заранее тянет главное фото каждой карточки. Префетч - по наведению (components/ui/Motion.tsx). */}
          <Link href={`/p/${model.slug}`} prefetch={false} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
            {model.name}
          </Link>
        </H>
        {facts && <p className="mt-1 text-sm text-ink-3">{facts}</p>}
        <div className="mt-1">
          <Stars rating={model.ratingAvg} count={model.ratingCount ? model.reviewsCount : undefined} compact />
        </div>
        <div className="mt-auto pt-2">
          <p className="text-[1.15rem] font-semibold leading-tight tabular-nums md:text-[1.25rem]">
            {model.minPrice === model.maxPrice ? formatPrice(model.minPrice) : `${t('common.from')} ${formatPrice(model.minPrice)}`}
          </p>
          {cheap.creditMonthlyPrice && (
            <p className="mt-0.5 text-sm font-semibold text-accent">
              {cheap.creditMonths ? t('buy.creditShort', { amount: cheap.creditMonthlyPrice, months: cheap.creditMonths }) : cheap.creditMonthlyPrice}
            </p>
          )}
        </div>
        {model.variants.length > 1 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-2.5">
            <span className="flex -space-x-1" aria-hidden="true">
              {model.variants.slice(0, MAX_SWATCHES).map((x) => (
                <span key={x.kaspiCode} className={`block h-5 w-5 overflow-hidden rounded-full bg-sand-2 ring-2 ring-bg ${x.inStock ? '' : 'opacity-40'}`}>
                  {x.images[0] && <img src={thumbSrc(x.images[0])} alt="" width={20} height={20} loading="lazy" className="swatch-crop h-full w-full object-cover" />}
                </span>
              ))}
            </span>
            <span className="text-sm text-ink-3">{t('common.colorsCount', { count: model.variants.length })}</span>
          </div>
        )}
      </div>
    </article>
  );
}
