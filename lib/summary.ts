import type { Category, Model, Variant } from './catalog';
import { specValues } from './catalog';
import { formatNumber, formatPrice, t } from './i18n';
import { parseWeightKg, prettyAge, uniq } from './text';

/*
 * Тексты, которые собираются из данных: «Коротко», подстановки в FAQ, сводки гайдов.
 * Любой такой текст проходит checkConsistency - проверку на противоречия с характеристиками.
 * Если проверка не прошла, сборка падает: лучше без текста, чем с ошибкой как у Larko («до 10 кг» при 20 кг).
 */

export class ConsistencyError extends Error {}

function fmtKg(n: number): string {
  return t('summary.kg', { value: String(n).replace('.', ',') });
}

/** Максимальный вес ребёнка по характеристикам Kaspi, если все расцветки согласны. */
export function maxWeightKg(model: Model): number | null {
  const ws = uniq(specValues(model.variants, 'Максимальный вес ребенка').map(parseWeightKg).filter((x): x is number => x !== null));
  return ws.length === 1 ? ws[0]! : null;
}

/** Вес самого изделия: «0,3-0,5 кг». Явные ошибки Kaspi (0 кг, 5 кг у рюкзака) отбрасываются. */
export function productWeight(model: Model): string | null {
  const ws = uniq(
    specValues(model.variants, 'Вес')
      .map(parseWeightKg)
      .filter((x): x is number => x !== null && x >= 0.05 && x <= 3),
  ).sort((a, b) => a - b);
  if (!ws.length) return null;
  return ws.length === 1
    ? fmtKg(ws[0]!)
    : t('summary.kgRange', { from: String(ws[0]).replace('.', ','), to: String(ws.at(-1)).replace('.', ',') });
}

/** Самая дешёвая расцветка (из тех, что в наличии): её цена стоит в «от ...», значит и рассрочка рядом должна быть её. */
export function cheapestVariant(model: Model): Variant {
  const pool = model.variants.some((v) => v.inStock) ? model.variants.filter((v) => v.inStock) : model.variants;
  return [...pool].sort((a, b) => a.price - b.price)[0] ?? model.defaultVariant;
}

export function creditText(model: Model): string | null {
  const v = cheapestVariant(model);
  if (!v.creditMonthlyPrice) return null;
  return v.creditMonths ? t('buy.creditShort', { amount: v.creditMonthlyPrice, months: v.creditMonths }) : v.creditMonthlyPrice;
}

export function priceText(model: Model): string {
  return model.minPrice === model.maxPrice
    ? formatPrice(model.minPrice)
    : t('common.priceRange', { min: formatPrice(model.minPrice), max: formatPrice(model.maxPrice) });
}

export function carryText(model: Model): string {
  return model.carryPositions.join(', ');
}

function mostCommon(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

/** Подстановка плейсхолдеров в тексты из content/. */
export function renderTemplate(text: string, model: Model): string {
  const maxW = maxWeightKg(model);
  const vars: Record<string, string> = {
    name: model.name,
    minPrice: formatPrice(model.minPrice),
    maxPrice: formatPrice(model.maxPrice),
    credit: creditText(model) ?? '-',
    reviews: t('common.reviewsCount', { count: model.reviewsCount }),
    ratings: t('common.ratingsCount', { count: model.ratingCount }),
    rating: model.ratingAvg !== null ? fmtRating(model.ratingAvg) : '-',
    colors: t('common.colorsCount', { count: model.variants.length }),
    colorsInStock: `${t('common.colorsCount', { count: model.variants.length })}, ${t('common.inStock')} - ${model.inStockCount}`,
    maxWeight: maxW !== null ? fmtKg(maxW) : '-',
    ageSpec: prettyAge(mostCommon(specValues(model.variants, 'Рекомендуемый возраст ребенка')) ?? '-'),
    carry: carryText(model) || '-',
    weight: productWeight(model) ?? '-',
  };
  const out = text.replace(/\{(\w+)\}/g, (whole, k: string) => vars[k] ?? whole);
  if (/\{\w+\}/.test(out)) throw new ConsistencyError(`Неизвестный плейсхолдер в тексте модели ${model.slug}: ${out}`);
  return out;
}

/** «Коротко» для карточки модели. Только факты из данных. */
export function modelSummary(model: Model): string {
  const parts: string[] = [];
  const credit = creditText(model);
  const creditPart = credit ? t('summary.credit', { credit }) : '';
  parts.push(
    model.minPrice === model.maxPrice
      ? t('summary.price', { name: model.name, price: formatPrice(model.minPrice), credit: creditPart })
      : t('summary.priceRange', { name: model.name, min: formatPrice(model.minPrice), max: formatPrice(model.maxPrice), credit: creditPart }),
  );
  if (model.ratingCount > 0 && model.ratingAvg !== null) {
    parts.push(
      t('summary.rating', {
        rating: fmtRating(model.ratingAvg),
        ratings: t('common.ratingsCount', { count: model.ratingCount }),
        reviews: t('common.reviewsCount', { count: model.reviewsCount }),
      }),
    );
  }
  const facts: string[] = [];
  // Товары для дома (бортики, матрас, накладки) Kaspi заполняет характеристиками переноски - возраст и вес ребёнка к ним не относятся.
  const isCarrier = model.category !== 'dlya-doma';
  const age = isCarrier ? mostCommon(specValues(model.variants, 'Рекомендуемый возраст ребенка')) : null;
  if (age) facts.push(t('summary.factAge', { value: prettyAge(age).toLowerCase() }));
  const maxW = isCarrier ? maxWeightKg(model) : null;
  if (maxW !== null) facts.push(t('summary.factWeight', { value: fmtKg(maxW) }));
  if (isCarrier && model.carryPositions.length) facts.push(t('summary.factCarry', { value: carryText(model) }));
  if (model.materials.length) facts.push(t('summary.factMaterial', { value: model.materials.join(', ') }));
  if (facts.length) parts.push(t('summary.facts', { facts: facts.join(t('summary.listSep')) }));
  if (model.variants.length > 1) {
    parts.push(t('summary.colors', { colors: t('common.colorsCount', { count: model.variants.length }), inStock: model.inStockCount }));
  } else if (!model.defaultVariant.inStock) {
    parts.push(t('summary.out'));
  }
  const text = parts.join(' ');
  checkConsistency(text, [model]);
  return text;
}

export function fmtRating(r: number): string {
  return r.toFixed(1).replace('.', ',');
}

/** «Коротко» для категории или подборки. */
export function categorySummary(cat: Pick<Category, 'name' | 'models'>, kind: 'category' | 'guide' = 'category'): string {
  const ms = cat.models;
  if (!ms.length) return '';
  const min = Math.min(...ms.map((m) => m.minPrice));
  const max = Math.max(...ms.map((m) => m.maxPrice));
  const reviews = ms.reduce((s, m) => s + m.reviewsCount, 0);
  const ratings = ms.reduce((s, m) => s + m.ratingCount, 0);
  const avg = ratings ? ms.reduce((s, m) => s + (m.ratingAvg ?? 0) * m.ratingCount, 0) / ratings : null;
  const inStock = ms.filter((m) => m.inStockCount > 0).length;
  const top = [...ms].sort((a, b) => b.reviewsCount - a.reviewsCount)[0];
  const parts = [
    t(kind === 'guide' ? 'summary.guide' : 'summary.category', {
      name: cat.name,
      models: t('common.modelsCount', { count: ms.length }),
      inStock,
      prices: min === max ? t('summary.priceOne', { price: formatPrice(min) }) : t('summary.pricesRange', { min: formatPrice(min), max: formatPrice(max) }),
    }),
  ];
  if (ratings && avg !== null) {
    parts.push(t('summary.categoryReviews', { reviews: t('common.reviewsCount', { count: reviews }), rating: fmtRating(avg) }));
  }
  if (top && top.reviewsCount > 0 && ms.length > 1) {
    parts.push(t('summary.categoryTop', { name: top.name, count: formatNumber(top.reviewsCount) }));
  }
  const text = parts.join(' ');
  checkConsistency(text, ms);
  return text;
}

const FORBIDDEN: Array<[RegExp, string]> = [
  [/мощност|ватт|\bвт\b|аккумулятор|заряд|батаре|литр|объём бака/i, 'шаблонный хвост из чужой категории'],
  [/ортопедическ|дисплази|гипертонус|лечебн|профилактик|недоношенн/i, 'медицинское утверждение без подтверждения'],
  [/устали|мучаетесь|мы понимаем вас/i, 'запрещённый тон'],
  [/\{\w+\}|undefined|NaN|null/, 'незаполненная подстановка'],
];

/**
 * Проверка сгенерированного текста на противоречия с данными моделей:
 * - любое «N кг» должно совпадать с весом из характеристик или черновых диапазонов;
 * - любая цена «N ₸» должна быть ценой одной из расцветок, платежом в месяц или суммой отзывов не быть;
 * - никаких шаблонных хвостов и медицинских обещаний.
 */
export function checkConsistency(text: string, models: Model[]): void {
  for (const [re, why] of FORBIDDEN) {
    if (re.test(text)) throw new ConsistencyError(`${why}: «${text}»`);
  }
  const allowedKg = new Set<number>();
  for (const m of models) {
    for (const v of specValues(m.variants, 'Максимальный вес ребенка')) {
      const w = parseWeightKg(v);
      if (w !== null) allowedKg.add(w);
    }
    for (const v of specValues(m.variants, 'Вес')) {
      const w = parseWeightKg(v);
      if (w !== null) allowedKg.add(w);
    }
    if (m.weightRange?.from != null) allowedKg.add(m.weightRange.from);
    if (m.weightRange?.to != null) allowedKg.add(m.weightRange.to);
  }
  for (const match of text.matchAll(/(\d+(?:[.,]\d+)?)\s*кг/g)) {
    const n = Number(match[1]!.replace(',', '.'));
    if (!allowedKg.has(n)) {
      throw new ConsistencyError(`В тексте «${n} кг», а в данных моделей ${models.map((m) => m.slug).join(', ')} такого веса нет: «${text}»`);
    }
  }
  const allowedPrices = new Set<number>();
  for (const m of models) {
    for (const v of m.variants) {
      allowedPrices.add(v.price);
      allowedPrices.add(v.priceBeforeDiscount);
      if (v.creditMonthlyPrice) allowedPrices.add(Number(v.creditMonthlyPrice.replace(/\D/g, '')));
      if (v.bonus) allowedPrices.add(v.bonus);
    }
  }
  for (const match of text.matchAll(/(\d{1,3}(?:[   ]\d{3})+|\d+)\s*₸/g)) {
    const n = Number(match[1]!.replace(/\D/g, ''));
    if (!allowedPrices.has(n)) throw new ConsistencyError(`В тексте цена ${n} ₸, которой нет в данных: «${text}»`);
  }
}
