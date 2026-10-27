import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import {
  listingFileSchema,
  productsFileSchema,
  reviewsFileSchema,
  merchantFileSchema,
  unmappedFileSchema,
  metaFileSchema,
  type KaspiImage,
  type ListingFile,
  type ProductsFile,
  type ReviewsFile,
  type Review,
  type SpecGroup,
  type MerchantFile,
  type MetaFile,
  type UnmappedItem,
} from './kaspi/schema';
import { DEFAULT_LOCALE, type Locale } from './i18n';
import { capitalize, parseAgeRange, parseWeightKg, uniq } from './text';

/*
 * Сборка каталога: наш слой (content/) поверх слоя Kaspi (data/kaspi/).
 * Если синхронизации ещё не было, берутся снимки из data/catalog-seed.json.
 */

const ROOT = process.cwd();

function readJsonFile<T>(rel: string, schema: z.ZodType<T>): T | null {
  const p = path.join(ROOT, rel);
  if (!existsSync(p)) return null;
  return schema.parse(JSON.parse(readFileSync(p, 'utf8')));
}

// ---------- наш слой ----------

const catalogSchema = z.object({
  categories: z.array(z.object({ slug: z.string(), order: z.number() })),
  models: z.array(
    z.object({
      slug: z.string(),
      category: z.string(),
      line: z.string().nullable(),
      order: z.number(),
      hidden: z.boolean(),
      variants: z.array(z.object({ kaspiCode: z.string(), designSlug: z.string(), hidden: z.boolean().optional() })),
      imageOrder: z.record(z.string(), z.array(z.number())),
      seasons: z.array(z.string()).default([]),
    }),
  ),
  collections: z.array(z.object({ slug: z.string(), models: z.array(z.string()), order: z.number() })).default([]),
});

const faqSchema = z.object({ q: z.string(), a: z.string() });
export type Faq = z.infer<typeof faqSchema>;

const seoSchema = z.object({ title: z.string().optional(), description: z.string().optional() });

const modelTextSchema = z.object({
  name: z.string(),
  lineLabel: z.string(),
  subtitle: z.string().optional(),
  whoFor: z.array(z.string()).default([]),
  howToWear: z.array(z.string()).default([]),
  care: z.array(z.string()).default([]),
  faq: z.array(faqSchema).default([]),
  seo: seoSchema.default({}),
  guide: z.string().optional(),
});
const modelsTextSchema = z.record(z.string(), z.unknown()).transform((rec) =>
  Object.fromEntries(Object.entries(rec).filter(([k]) => !k.startsWith('_')).map(([k, v]) => [k, modelTextSchema.parse(v)])),
);

const categoryTextSchema = z.object({
  name: z.string(),
  nameShort: z.string().optional(),
  intro: z.string(),
  seoText: z.array(z.string()).default([]),
  faq: z.array(faqSchema).default([]),
  guides: z.array(z.string()).default([]),
  seo: seoSchema.default({}),
});
const categoriesTextSchema = z.record(z.string(), z.unknown()).transform((rec) =>
  Object.fromEntries(Object.entries(rec).filter(([k]) => !k.startsWith('_')).map(([k, v]) => [k, categoryTextSchema.parse(v)])),
);

const designsSchema = z.object({ verified: z.boolean(), names: z.record(z.string(), z.string()) });

const lineSchema = z.object({
  verified: z.boolean(),
  ageFromMonths: z.number().nullable(),
  ageToMonths: z.number().nullable(),
  weightFromKg: z.number().nullable(),
  weightToKg: z.number().nullable(),
  uses: z.array(z.enum(['home', 'walks', 'travel', 'winter'])),
  kaspiSays: z.string(),
});
const linesFileSchema = z.object({
  lines: z.record(z.string(), lineSchema),
  podbor: z.object({
    ages: z.array(z.object({ id: z.string(), fromMonths: z.number(), toMonths: z.number() })),
    weights: z.array(z.object({ id: z.string(), fromKg: z.number(), toKg: z.number() })),
    where: z.array(z.enum(['home', 'walks', 'travel', 'winter'])),
    carrierModels: z.array(z.string()),
    winterAddonModels: z.array(z.string()),
    maxResults: z.number(),
  }),
});
export type LinesFile = z.infer<typeof linesFileSchema>;
export type LineRule = z.infer<typeof lineSchema>;

const seedSchema = z.object({
  variants: z.array(
    z.object({
      kaspiCode: z.string(),
      kaspiUrl: z.string(),
      kaspiTitle: z.string(),
      priceKztSnapshot: z.number(),
      reviewsOnListingSnapshot: z.number(),
    }),
  ),
});

// ---------- модель предметной области ----------

export type Range = { from: number | null; to: number | null };

export type Variant = {
  kaspiCode: string;
  kaspiUrl: string;
  kaspiTitle: string;
  designSlug: string;
  designName: string;
  colorFamily: string;
  price: number;
  priceBeforeDiscount: number;
  creditMonthlyPrice: string | null;
  creditMonths: number | null;
  bonus: number;
  inStock: boolean;
  rating: number | null;
  reviewsCount: number;
  ratingCount: number;
  images: KaspiImage[];
  videoId: string | null;
  specs: SpecGroup[];
  kaspiDescription: string;
  kaspiModelName: string | null;
  updatedAt: string | null;
};

export type Model = {
  slug: string;
  category: string;
  line: string | null;
  lineLabel: string;
  name: string;
  subtitle: string | null;
  whoFor: string[];
  howToWear: string[];
  care: string[];
  faq: Faq[];
  seo: { title?: string; description?: string };
  guide: string | null;
  order: number;
  hidden: boolean;
  unmapped: boolean;
  ageRange: Range | null;
  weightRange: Range | null;
  rangesVerified: boolean;
  carryPositions: string[];
  seasons: string[];
  materials: string[];
  variants: Variant[];
  defaultVariant: Variant;
  minPrice: number;
  maxPrice: number;
  ratingAvg: number | null;
  ratingCount: number;
  reviewsCount: number;
  inStockCount: number;
  hasDiscount: boolean;
  isHit: boolean;
  videoIds: string[];
};

export type Category = {
  slug: string;
  name: string;
  nameShort: string;
  intro: string;
  seoText: string[];
  faq: Faq[];
  guides: string[];
  seo: { title?: string; description?: string };
  order: number;
  models: Model[];
};

export type Collection = Omit<Category, 'order'> & { order: number; isCollection: true };

type Catalog = {
  locale: Locale;
  categories: Category[];
  collections: Collection[];
  models: Model[];
  lines: LinesFile;
  merchant: MerchantFile | null;
  meta: MetaFile | null;
  pricesDate: string;
  unmapped: UnmappedItem[];
};

// ---------- сборка ----------

function feature(specs: SpecGroup[], name: string): string[] {
  for (const g of specs) for (const f of g.features) if (f.name.toLowerCase() === name.toLowerCase()) return f.values;
  return [];
}

export function specValues(variants: Variant[], name: string): string[] {
  return uniq(variants.flatMap((v) => feature(v.specs, name)));
}

function colorFromTitle(title: string): string {
  const tail = title.split(',').at(-1)?.trim().toLowerCase() ?? '';
  return tail.replace(/ё/g, 'е');
}

function orderImages(images: KaspiImage[], order: number[] | undefined): KaspiImage[] {
  if (!order?.length) return images;
  const picked = order.map((i) => images[i]).filter((x): x is KaspiImage => Boolean(x));
  const rest = images.filter((_, i) => !order.includes(i));
  return [...picked, ...rest];
}

const UNMAPPED_CATEGORY_BY_KASPI: Array<[RegExp, string]> = [
  [/эргорюкзак|кенгуру/i, 'ergoryukzaki'],
  [/слинг/i, 'slingi'],
  [/накидк|конверт/i, 'nakidki'],
];

let cache: Catalog | null = null;

export function getCatalog(locale: Locale = DEFAULT_LOCALE): Catalog {
  if (cache && cache.locale === locale) return cache;

  const catalog = catalogSchema.parse(JSON.parse(readFileSync(path.join(ROOT, 'content/catalog.json'), 'utf8')));
  const modelTexts = modelsTextSchema.parse(JSON.parse(readFileSync(path.join(ROOT, `content/${locale}/models.json`), 'utf8')));
  const categoryTexts = categoriesTextSchema.parse(
    JSON.parse(readFileSync(path.join(ROOT, `content/${locale}/categories.json`), 'utf8')),
  );
  const designs = designsSchema.parse(JSON.parse(readFileSync(path.join(ROOT, `content/${locale}/designs.json`), 'utf8')));
  const lines = linesFileSchema.parse(JSON.parse(readFileSync(path.join(ROOT, 'content/lines.json'), 'utf8')));
  const seed = seedSchema.parse(JSON.parse(readFileSync(path.join(ROOT, 'data/catalog-seed.json'), 'utf8')));
  const seedBy = new Map(seed.variants.map((v) => [v.kaspiCode, v]));

  const listing: ListingFile | null = readJsonFile('data/kaspi/listing.json', listingFileSchema);
  const products: ProductsFile | null = readJsonFile('data/kaspi/products.json', productsFileSchema);
  const merchant = readJsonFile('data/kaspi/merchant.json', merchantFileSchema);
  const meta = readJsonFile('data/kaspi/meta.json', metaFileSchema);
  const unmapped = readJsonFile('data/kaspi/unmapped.json', unmappedFileSchema) ?? [];

  const reviewSummary = (code: string) => readReviewsFile(code);

  function buildVariant(code: string, designSlug: string, designName: string, imageOrder?: number[]): Variant {
    const l = listing?.items[code];
    const p = products?.items[code];
    const s = seedBy.get(code);
    const r = reviewSummary(code);
    const title = p?.title ?? l?.title ?? s?.kaspiTitle ?? '';
    const price = l?.price ?? s?.priceKztSnapshot ?? 0;
    return {
      kaspiCode: code,
      kaspiUrl: p?.url ?? l?.url ?? s?.kaspiUrl ?? `https://kaspi.kz/shop/search/?text=${code}`,
      kaspiTitle: title,
      designSlug,
      designName,
      colorFamily: colorFromTitle(title),
      price,
      priceBeforeDiscount: l?.priceBeforeDiscount ?? price,
      creditMonthlyPrice: l?.creditMonthlyPrice?.replace(/ /g, '\u00a0') ?? null,
      creditMonths: l?.creditMonths ?? null,
      bonus: l?.bonus ?? 0,
      inStock: l?.inStock ?? Boolean(s),
      rating: r?.ratingAvg ?? l?.rating ?? null,
      reviewsCount: r?.commentCount ?? l?.reviewsCount ?? s?.reviewsOnListingSnapshot ?? 0,
      ratingCount: r?.ratingCount ?? l?.reviewsCount ?? s?.reviewsOnListingSnapshot ?? 0,
      images: orderImages(p?.images ?? [], imageOrder),
      videoId: p?.videoId ?? null,
      specs: p?.specs ?? [],
      kaspiDescription: p?.description ?? '',
      kaspiModelName: p?.kaspiModelName ?? r?.kaspiModelName ?? null,
      updatedAt: listing?.syncedAt ?? null,
    };
  }

  function finishModel(base: { seasonsOverride: string[] } & Omit<Model, 'defaultVariant' | 'minPrice' | 'maxPrice' | 'ratingAvg' | 'ratingCount' | 'reviewsCount' | 'inStockCount' | 'hasDiscount' | 'isHit' | 'videoIds' | 'carryPositions' | 'seasons' | 'materials' | 'ageRange' | 'weightRange' | 'rangesVerified'>): Model {
    const vs = base.variants;
    const inStock = vs.filter((v) => v.inStock);
    const pool = inStock.length ? inStock : vs;
    const defaultVariant = [...pool].sort((a, b) => b.ratingCount - a.ratingCount)[0] ?? vs[0];
    if (!defaultVariant) throw new Error(`У модели ${base.slug} нет расцветок`);
    const prices = pool.map((v) => v.price).filter((p) => p > 0);
    const ratingCount = vs.reduce((s, v) => s + v.ratingCount, 0);
    const weighted = vs.reduce((s, v) => s + (v.rating ?? 0) * v.ratingCount, 0);
    const line = base.line ? lines.lines[base.line] : undefined;

    const specAge = specValues(vs, 'Рекомендуемый возраст ребенка');
    const specWeight = specValues(vs, 'Максимальный вес ребенка');
    const ageFromSpec = specAge.map(parseAgeRange).find((x) => x !== null) ?? null;
    const weightFromSpec = specWeight.map(parseWeightKg).find((x) => x !== null) ?? null;

    const ageRange: Range | null = line
      ? { from: line.ageFromMonths, to: line.ageToMonths }
      : ageFromSpec;
    const weightRange: Range | null = line
      ? { from: line.weightFromKg, to: line.weightToKg ?? weightFromSpec }
      : weightFromSpec !== null
        ? { from: null, to: weightFromSpec }
        : null;

    const { seasonsOverride: _ignored, ...rest } = base;
    void _ignored;
    return {
      ...rest,
      defaultVariant,
      minPrice: prices.length ? Math.min(...prices) : defaultVariant.price,
      maxPrice: prices.length ? Math.max(...prices) : defaultVariant.price,
      ratingAvg: ratingCount ? Math.round((weighted / ratingCount) * 10) / 10 : null,
      ratingCount,
      reviewsCount: vs.reduce((s, v) => s + v.reviewsCount, 0),
      inStockCount: inStock.length,
      hasDiscount: vs.some((v) => v.inStock && v.priceBeforeDiscount > v.price),
      isHit: false,
      videoIds: uniq(vs.map((v) => v.videoId).filter((x): x is string => Boolean(x))),
      carryPositions: specValues(vs, 'Способ ношения'),
      seasons: base.seasonsOverride.length ? base.seasonsOverride : specValues(vs, 'Сезон'),
      materials: specValues(vs, 'Материал'),
      ageRange,
      weightRange,
      rangesVerified: line?.verified ?? false,
    };
  }

  const models: Model[] = catalog.models.map((m) => {
    const text = modelTexts[m.slug];
    if (!text) throw new Error(`Нет текстов для модели ${m.slug} в content/${locale}/models.json`);
    const variants = m.variants
      .filter((v) => !v.hidden)
      .map((v) => buildVariant(v.kaspiCode, v.designSlug, designs.names[v.kaspiCode] ?? v.designSlug, m.imageOrder[v.kaspiCode]));
    return finishModel({
      slug: m.slug,
      category: m.category,
      line: m.line,
      lineLabel: text.lineLabel,
      name: text.name,
      subtitle: text.subtitle ?? null,
      whoFor: text.whoFor,
      howToWear: text.howToWear,
      care: text.care,
      faq: text.faq,
      seo: text.seo,
      guide: text.guide ?? null,
      order: m.order,
      hidden: m.hidden,
      unmapped: false,
      variants,
      seasonsOverride: m.seasons,
    });
  });

  // Новые SKU без маппинга - отдельными карточками с названием Kaspi.
  for (const [i, u] of unmapped.entries()) {
    const category = UNMAPPED_CATEGORY_BY_KASPI.find(([re]) => re.test(`${u.kaspiCategory} ${u.title}`))?.[1] ?? 'dlya-doma';
    const v = buildVariant(u.kaspiCode, 'default', colorFromTitle(u.title));
    models.push(
      finishModel({
        slug: `kaspi-${u.kaspiCode}`,
        category,
        line: null,
        lineLabel: u.title,
        name: u.title,
        subtitle: null,
        whoFor: [],
        howToWear: [],
        care: [],
        faq: [],
        seo: {},
        guide: null,
        order: 1000 + i,
        hidden: false,
        unmapped: true,
        variants: [v],
        seasonsOverride: [],
      }),
    );
  }

  const visible = models.filter((m) => !m.hidden);
  const hits = [...visible].filter((m) => m.reviewsCount > 0).sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, 3);
  for (const h of hits) h.isHit = true;

  const categories: Category[] = catalog.categories
    .map((c) => {
      const text = categoryTexts[c.slug];
      if (!text) throw new Error(`Нет текстов для категории ${c.slug}`);
      return {
        slug: c.slug,
        name: text.name,
        nameShort: text.nameShort ?? text.name,
        intro: text.intro,
        seoText: text.seoText,
        faq: text.faq,
        guides: text.guides,
        seo: text.seo,
        order: c.order,
        models: visible.filter((m) => m.category === c.slug).sort((a, b) => a.order - b.order),
      };
    })
    .sort((a, b) => a.order - b.order);

  const collectionTexts = categoriesTextSchema.parse(
    (JSON.parse(readFileSync(path.join(ROOT, `content/${locale}/categories.json`), 'utf8')) as { _collections?: unknown })._collections ?? {},
  );
  const collections: Collection[] = catalog.collections.map((c) => {
    const text = collectionTexts[c.slug];
    if (!text) throw new Error(`Нет текстов для подборки ${c.slug}`);
    return {
      slug: c.slug,
      name: text.name,
      nameShort: text.nameShort ?? text.name,
      intro: text.intro,
      seoText: text.seoText,
      faq: text.faq,
      guides: text.guides,
      seo: text.seo,
      order: c.order,
      isCollection: true as const,
      models: c.models.map((slug) => visible.find((m) => m.slug === slug)).filter((m): m is Model => Boolean(m)),
    };
  });

  cache = {
    locale,
    categories,
    collections,
    models: visible.sort((a, b) => a.order - b.order),
    lines,
    merchant,
    meta,
    pricesDate: meta?.pricesSyncedAt ?? listing?.syncedAt ?? '2026-10-27',
    unmapped,
  };
  return cache;
}

export function getModel(slug: string): Model | undefined {
  return getCatalog().models.find((m) => m.slug === slug);
}

export function getCategory(slug: string): Category | undefined {
  return getCatalog().categories.find((c) => c.slug === slug);
}

const reviewsCache = new Map<string, ReviewsFile | null>();
export function readReviewsFile(code: string): ReviewsFile | null {
  if (!reviewsCache.has(code)) reviewsCache.set(code, readJsonFile(`data/kaspi/reviews/${code}.json`, reviewsFileSchema));
  return reviewsCache.get(code) ?? null;
}

export type ModelReview = Review & { designName: string; designSlug: string; modelSlug: string };

/** Отзывы модели по всем расцветкам. Первыми - полезные с текстом. */
export function getModelReviews(model: Model): ModelReview[] {
  const out: ModelReview[] = [];
  for (const v of model.variants) {
    for (const r of readReviewsFile(v.kaspiCode)?.reviews ?? []) {
      out.push({ ...r, designName: v.designName, designSlug: v.designSlug, modelSlug: model.slug });
    }
  }
  return sortReviews(out);
}

export function sortReviews<T extends Review>(list: T[]): T[] {
  const score = (r: Review) => (r.text.length >= 40 ? 1000 : 0) + r.helpfulCount * 10 + (r.photos.length ? 5 : 0) + Math.min(r.text.length, 400) / 100;
  return [...list].sort((a, b) => score(b) - score(a) || b.date.localeCompare(a.date));
}

export function modelDistribution(model: Model): Record<1 | 2 | 3 | 4 | 5, number> {
  const d = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  for (const v of model.variants) {
    const r = readReviewsFile(v.kaspiCode);
    if (!r) continue;
    for (const k of [1, 2, 3, 4, 5] as const) d[k] += r.distribution[k];
  }
  return d;
}

export function getAllReviews(): ModelReview[] {
  return sortReviews(getCatalog().models.flatMap((m) => getModelReviews(m)));
}

/** Цифры доверия: лет на Kaspi, заказов, отзывов, средняя оценка. Только из синхронизации. */
export function getTrustNumbers() {
  const { merchant, models, pricesDate } = getCatalog();
  const ratingCount = models.reduce((s, m) => s + m.ratingCount, 0);
  const weighted = models.reduce((s, m) => s + (m.ratingAvg ?? 0) * m.ratingCount, 0);
  const reviews = models.reduce((s, m) => s + m.reviewsCount, 0);
  let years: number | null = null;
  if (merchant) {
    const [y, mo, d] = merchant.createdAt.split('-').map(Number);
    const [ty, tm, td] = pricesDate.split('-').map(Number);
    if (y && mo && d && ty && tm && td) years = ty - y - (tm < mo || (tm === mo && td < d) ? 1 : 0);
  }
  return {
    years,
    ordersSegment: merchant?.ordersSegment ?? null,
    reviews,
    ratingCount,
    rating: ratingCount ? Math.round((weighted / ratingCount) * 10) / 10 : null,
    skuCount: models.reduce((s, m) => s + m.variants.length, 0),
  };
}

export { capitalize };
