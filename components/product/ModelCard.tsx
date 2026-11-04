import Link from 'next/link';
import type { Model, Variant } from '@/lib/catalog';
import { t } from '@/lib/i18n';
import { cardSrcSet, thumbSrc } from '@/lib/images';
import { cheapestVariant, maxWeightKg } from '@/lib/summary';
import { Stars } from '@/components/ui/Stars';
import { PriceBadges, PriceLine } from './Price';
import { AfterLoadImg } from '@/components/ui/AfterLoadImg';

const MAX_SWATCHES = 5;

/** Карточка модели. С variant - карточка одной расцветки (раздел из одной модели, например «Слинги»). */
export function ModelCard({
  model,
  variant,
  priority = false,
  headingLevel = 3,
}: {
  model: Model;
  variant?: Variant;
  priority?: boolean;
  headingLevel?: 2 | 3;
}) {
  const v = variant ?? model.defaultVariant;
  const img = v.images[0];
  const href = variant ? `/p/${model.slug}?color=${variant.designSlug}` : `/p/${model.slug}`;
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const maxW = maxWeightKg(model);
  const cheap = variant ?? cheapestVariant(model);
  const outOfStock = variant ? !variant.inStock : model.inStockCount === 0;
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
        {/* Скидка - меткой «-11%» у цены, как на Kaspi. */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5 text-[0.8125rem] font-semibold">
          {model.isHit && !variant && <span className="rounded-full bg-surface px-2.5 py-1 text-ink">{t('common.hit')}</span>}
          {outOfStock && <span className="rounded-full bg-surface px-2.5 py-1 text-ink-2">{t('common.outOfStock')}</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col pt-3">
        <H className="font-sans text-[0.9375rem] font-semibold leading-snug tracking-normal">
          {/* Без префетча по появлению: иначе React заранее тянет главное фото каждой карточки. Префетч - по наведению (components/ui/Motion.tsx). */}
          <Link href={href} prefetch={false} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
            {variant ? t('model.variantName', { line: model.lineLabel, design: variant.designName }) : model.name}
          </Link>
        </H>
        {facts && <p className="mt-1 text-sm text-ink-3">{facts}</p>}
        <div className="mt-1">
          <Stars rating={model.ratingAvg} count={model.ratingCount ? model.reviewsCount : undefined} compact />
        </div>
        <div className="mt-auto pt-2.5">
          <PriceBadges p={cheap} className="mb-1.5" />
          <PriceLine p={cheap} from={!variant && model.minPrice !== model.maxPrice} size="text-[1.0625rem] md:text-[1.125rem]" />
          {cheap.creditMonthlyPrice && (
            <p className="mt-0.5 text-sm font-semibold text-kaspi-text">
              {cheap.creditMonths ? t('buy.creditShort', { amount: cheap.creditMonthlyPrice, months: cheap.creditMonths }) : cheap.creditMonthlyPrice}
            </p>
          )}
        </div>
        {!variant && model.variants.length > 1 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-2.5">
            <span className="flex -space-x-1" aria-hidden="true">
              {model.variants.slice(0, MAX_SWATCHES).map((x) => (
                <span key={x.kaspiCode} className={`block h-5 w-5 overflow-hidden rounded-full bg-sand-2 ring-2 ring-bg ${x.inStock ? '' : 'opacity-40'}`}>
                  {x.images[0] && <AfterLoadImg src={thumbSrc(x.images[0])} alt="" width={20} height={20} className="swatch-crop h-full w-full object-cover" />}
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
