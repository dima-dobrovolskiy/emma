import { getModel, getModelReviews, specValues, type Model } from './catalog';
import { checkConsistency, maxWeightKg } from './summary';
import { formatPrice, t } from './i18n';
import { fmtRatingClient } from './format';

export function guideModels(slugs: string[]): Model[] {
  return slugs.map((s) => {
    const m = getModel(s);
    if (!m) throw new Error(`Гайд ссылается на несуществующую модель ${s}`);
    return m;
  });
}

/** Оснащённость: особенности + способы ношения + позиции ребёнка + комплектация. */
export function equipmentScore(m: Model): number {
  return (
    specValues(m.variants, 'Особенности').length +
    m.carryPositions.length +
    specValues(m.variants, 'Расположение ребенка').length +
    (specValues(m.variants, 'Поясной ремень').includes('да') ? 1 : 0)
  );
}

export type WhatToBuyPick = { kind: 'cheapest' | 'popular' | 'equipped'; model: Model; reason: string };

/**
 * «Что брать»: дешевле всего, чаще всего берут, самая оснащённая.
 * Модели не повторяются: если отличной от уже выбранных нет, пункт не показываем.
 */
export function whatToBuy(models: Model[]): WhatToBuyPick[] {
  const inStock = models.filter((m) => m.inStockCount > 0);
  const pool = inStock.length ? inStock : models;
  const used = new Set<string>();
  const picks: WhatToBuyPick[] = [];
  const take = (kind: WhatToBuyPick['kind'], sorted: Model[], reason: (m: Model) => string) => {
    const m = sorted.find((x) => !used.has(x.slug));
    if (!m) return;
    used.add(m.slug);
    picks.push({ kind, model: m, reason: reason(m) });
  };
  take('popular', [...pool].sort((a, b) => b.reviewsCount - a.reviewsCount), (m) =>
    t('guides.whyPopular', { reviews: t('common.reviewsCount', { count: m.reviewsCount }), rating: m.ratingAvg !== null ? fmtRatingClient(m.ratingAvg) : '-' }),
  );
  take('cheapest', [...pool].sort((a, b) => a.minPrice - b.minPrice || b.reviewsCount - a.reviewsCount), (m) =>
    t('guides.whyCheapest', { price: formatPrice(m.minPrice) }),
  );
  take('equipped', [...pool].sort((a, b) => equipmentScore(b) - equipmentScore(a) || (maxWeightKg(b) ?? 0) - (maxWeightKg(a) ?? 0)), (m) =>
    t('guides.whyEquipped', { features: [...specValues(m.variants, 'Особенности'), ...m.carryPositions].join(', ') }),
  );
  for (const p of picks) checkConsistency(p.reason, [p.model]);
  return picks;
}

/** Короткие цитаты из отзывов: полезные, с текстом средней длины, по одной на модель по кругу. */
export function reviewQuotes(models: Model[], count = 4) {
  const perModel = models.map((m) =>
    getModelReviews(m)
      .filter((r) => r.rating >= 4 && r.text.length >= 60 && r.text.length <= 320)
      .slice(0, count)
      .map((r) => ({ ...r, modelName: m.name, modelSlug: m.slug })),
  );
  const out: Array<(typeof perModel)[number][number]> = [];
  for (let i = 0; out.length < count && i < count; i++) {
    for (const list of perModel) {
      const r = list[i];
      if (r && out.length < count) out.push(r);
    }
  }
  return out;
}
