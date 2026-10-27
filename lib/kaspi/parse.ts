import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { KaspiImage, KaspiProduct, ListingItem, Review, SpecGroup } from './schema';

/*
 * Разбор ответов Kaspi. Чистые функции без сети - покрыты юнит-тестами.
 * Сырые схемы проверяют только поля, которые мы реально используем:
 * если Kaspi поменяет формат, синхронизация упадёт, а не запишет мусор.
 */

const rawImage = z.object({ small: z.string(), medium: z.string(), large: z.string() });

const rawListingItem = z.object({
  id: z.string(),
  configSku: z.string().optional(),
  title: z.string(),
  shopLink: z.string(),
  unitPrice: z.number(),
  unitSalePrice: z.number().optional(),
  priceMinusBonus: z.number().optional(),
  creditMonthlyPrice: z.number().optional(),
  monthlyInstallment: z.object({ id: z.number(), formattedPerMonth: z.string() }).nullish(),
  rating: z.number().optional(),
  reviewsQuantity: z.number().optional(),
  stock: z.number().optional(),
  category: z.array(z.string()).optional(),
});
export const rawListingSchema = z.object({ data: z.array(rawListingItem) });

const rawFeature = z.object({
  name: z.string(),
  featureValues: z.array(z.object({ value: z.string() })).nullish(),
});
export const rawItemSchema = z.object({
  card: z.object({
    id: z.string(),
    title: z.string(),
    shopLink: z.string(),
    createdTime: z.string().nullish(),
    price: z.number(),
    unitPriceBeforeDiscount: z.number().nullish(),
    rating: z.number().nullish(),
    reviewsQuantity: z.number().nullish(),
    promoConditions: z.object({ baseProductCodes: z.array(z.string()).nullish() }).nullish(),
  }),
  videoId: z.string().nullish(),
  galleryImages: z.array(rawImage).nullish(),
  specifications: z.array(z.object({ name: z.string(), features: z.array(rawFeature) })).nullish(),
  description: z.string().nullish(),
  breadcrumbs: z.array(z.object({ title: z.string() })).nullish(),
});
export type RawItem = z.infer<typeof rawItemSchema>;

const rawReview = z.object({
  id: z.string(),
  author: z.string().nullish(),
  date: z.string(),
  rating: z.number(),
  comment: z.object({ text: z.string().nullish(), plus: z.string().nullish(), minus: z.string().nullish() }).nullish(),
  feedback: z.object({ positive: z.number().nullish() }).nullish(),
  galleryImages: z.array(rawImage).nullish(),
  product: z.object({ name: z.string().nullish() }).nullish(),
});
export const rawReviewsSchema = z.object({
  data: z.array(rawReview),
  summary: z.object({ global: z.number().nullish(), statistic: z.array(z.object({ rate: z.number(), count: z.number() })) }).nullish(),
  groupSummary: z.array(z.object({ id: z.string(), total: z.number() })).nullish(),
});
export type RawReviews = z.infer<typeof rawReviewsSchema>;

export const rawMerchantSchema = z.object({
  uid: z.string(),
  name: z.string(),
  created: z.string(),
  merchantMetrics: z
    .object({ orderStatistics: z.object({ ordersTotalSegment: z.string().nullish() }).nullish() })
    .nullish(),
});

export const KASPI_ORIGIN = 'https://kaspi.kz';

export function absoluteKaspiUrl(shopLink: string): string {
  const path = shopLink.startsWith('/shop/') ? shopLink : `/shop${shopLink.startsWith('/') ? '' : '/'}${shopLink}`;
  const url = new URL(path, KASPI_ORIGIN);
  url.search = '';
  return url.toString();
}

/** Достаёт JSON-объект, присвоенный `BACKEND.components.<name>` в HTML страницы. */
export function extractBackendComponent(html: string, name: string): unknown {
  const marker = `BACKEND.components.${name}`;
  const at = html.indexOf(marker);
  if (at < 0) throw new Error(`В HTML нет ${marker}`);
  const start = html.indexOf('{', at);
  if (start < 0) throw new Error(`После ${marker} нет объекта`);
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return JSON.parse(html.slice(start, i + 1));
    }
  }
  throw new Error(`Объект ${marker} не закрыт`);
}

export function formatKzt(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU').replace(/ | /g, ' ')} ₸`;
}

export function parseListingItem(raw: z.infer<typeof rawListingItem>): ListingItem {
  const kaspiCode = raw.configSku && raw.id !== raw.configSku && /\D/.test(raw.id) ? raw.configSku : raw.id;
  const price = raw.unitSalePrice ?? raw.unitPrice;
  const credit = raw.monthlyInstallment?.formattedPerMonth?.replace(/ | /g, ' ') ?? null;
  return {
    kaspiCode,
    title: raw.title,
    url: absoluteKaspiUrl(raw.shopLink),
    price,
    priceBeforeDiscount: Math.max(raw.unitPrice, price),
    bonus: raw.priceMinusBonus != null ? Math.max(0, price - raw.priceMinusBonus) : 0,
    creditMonthlyPrice: credit ?? (raw.creditMonthlyPrice ? formatKzt(raw.creditMonthlyPrice) : null),
    creditMonths: raw.monthlyInstallment?.id ?? null,
    inStock: (raw.stock ?? 0) > 0,
    rating: raw.rating ?? null,
    reviewsCount: raw.reviewsQuantity ?? 0,
    kaspiCategory: raw.category?.at(-1) ?? null,
  };
}

/** «[Master - ...][slingoemma]{эргорюкзак}{18}{Слинг 2+ Tiddly Черный}» → «Слинг 2+ Tiddly Черный» */
export function modelNameFromBaseCodes(codes: readonly string[] | null | undefined): string | null {
  for (const code of codes ?? []) {
    const groups = [...code.matchAll(/\{([^}]*)\}/g)].map((m) => m[1]?.trim() ?? '');
    const last = groups.at(-1);
    if (last && /\D/.test(last)) return decodeEntities(last);
  }
  return null;
}

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  quot: '"',
  laquo: '«',
  raquo: '»',
  mdash: '—',
  ndash: '–',
  apos: "'",
  amp: '&',
  lt: '<',
  gt: '>',
  hellip: '…',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, ent: string) => {
    if (ent[0] === '#') {
      const code = ent[1]?.toLowerCase() === 'x' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return NAMED_ENTITIES[ent.toLowerCase()] ?? whole;
  });
}

export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|li|div|h\d)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function normalizeSpecValue(v: string): string {
  if (v === 'true') return 'да';
  if (v === 'false') return 'нет';
  return decodeEntities(v).replace(/\s+/g, ' ').trim();
}

export function parseSpecs(raw: RawItem['specifications']): SpecGroup[] {
  return (raw ?? []).map((g) => ({
    name: g.name,
    features: g.features
      .map((f) => ({ name: f.name, values: (f.featureValues ?? []).map((x) => normalizeSpecValue(x.value)).filter(Boolean) }))
      .filter((f) => f.values.length > 0),
  }));
}

export function parseProduct(raw: RawItem, finalUrl: string): KaspiProduct {
  const images: KaspiImage[] = (raw.galleryImages ?? []).map((i) => ({ small: i.small, medium: i.medium, large: i.large }));
  return {
    kaspiCode: raw.card.id,
    title: decodeEntities(raw.card.title),
    url: finalUrl,
    kaspiModelName: modelNameFromBaseCodes(raw.card.promoConditions?.baseProductCodes),
    kaspiCategory: raw.breadcrumbs?.at(-1)?.title ?? null,
    images,
    videoId: raw.videoId || null,
    specs: parseSpecs(raw.specifications),
    description: htmlToText(raw.description ?? ''),
    createdAt: raw.card.createdTime ?? null,
  };
}

export function reviewId(kaspiId: string): string {
  return createHash('sha1').update(`kaspi-review:${kaspiId}`).digest('hex').slice(0, 16);
}

/** dd.mm.yyyy → yyyy-mm-dd */
export function parseKaspiDate(d: string): string {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(d.trim());
  if (!m) throw new Error(`Неожиданный формат даты отзыва: ${d}`);
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/**
 * Отзыв Kaspi → наш формат. Номер заказа, редактируемость и прочие лишние поля не сохраняем.
 * Автор - только имя, как его показывает Kaspi.
 */
export function parseReview(raw: RawReviews['data'][number], kaspiCode: string): Review {
  return {
    id: reviewId(raw.id),
    kaspiCode,
    author: (raw.author ?? '').trim().split(/\s+/)[0] ?? '',
    date: parseKaspiDate(raw.date),
    rating: Math.min(5, Math.max(1, Math.round(raw.rating))),
    text: decodeEntities(raw.comment?.text ?? '').trim(),
    plus: decodeEntities(raw.comment?.plus ?? '').trim(),
    minus: decodeEntities(raw.comment?.minus ?? '').trim(),
    photos: (raw.galleryImages ?? []).map((i) => ({ small: i.small, medium: i.medium, large: i.large })),
    helpfulCount: Math.max(0, raw.feedback?.positive ?? 0),
  };
}

export function groupTotal(raw: RawReviews, id: string): number {
  return raw.groupSummary?.find((g) => g.id === id)?.total ?? 0;
}

export function distributionOf(raw: RawReviews): Record<1 | 2 | 3 | 4 | 5, number> {
  const d = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  for (const s of raw.summary?.statistic ?? []) {
    if (s.rate >= 1 && s.rate <= 5) d[s.rate as 1 | 2 | 3 | 4 | 5] = s.count;
  }
  return d;
}
