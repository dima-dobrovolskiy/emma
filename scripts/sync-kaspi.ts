/*
 * Синхронизация витрины с Kaspi. Без браузера, только HTTP.
 *
 *   pnpm sync              - полный срез: цены, карточки, фото, отзывы, новые SKU (раз в сутки)
 *   pnpm sync:prices       - только цены и наличие (каждый час)
 *
 * Флаги: --only=106533064,106916682  --cache  --dry-run
 *
 * Правила: запросы последовательно с паузой 1-2 с, таймауты, ретраи с backoff.
 * При сбое (цена 0, пропало больше 30% SKU, сломался формат) ничего не пишем
 * и выходим с кодом 1 - остаётся последний удачный срез.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  rawListingSchema,
  rawItemSchema,
  rawReviewsSchema,
  rawMerchantSchema,
  extractBackendComponent,
  parseListingItem,
  parseProduct,
  parseReview,
  groupTotal,
  distributionOf,
  type RawReviews,
} from '../lib/kaspi/parse';
import {
  listingFileSchema,
  productsFileSchema,
  reviewsFileSchema,
  merchantFileSchema,
  unmappedFileSchema,
  metaFileSchema,
  type ListingFile,
  type ListingItem,
  type ProductsFile,
  type KaspiProduct,
  type ReviewsFile,
  type Review,
  type MerchantFile,
  type UnmappedItem,
  type MetaFile,
} from '../lib/kaspi/schema';
import { checkListing, MAX_MISSING_SHARE } from '../lib/kaspi/guard';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'data/kaspi');
const CACHE = path.join(ROOT, '.cache/kaspi');
const MERCHANT_ID = '8851015';
const CITY_ID = '750000000';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const REVIEWS_PAGE = 100;

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k ?? '', v ?? 'true'] as const;
  }),
);
const MODE = args.get('mode') === 'prices' ? 'prices' : 'full';
const ONLY = args.get('only')?.split(',').filter(Boolean) ?? null;
const USE_CACHE = args.has('cache');
const DRY = args.has('dry-run');

class SyncError extends Error {}

function log(...m: unknown[]) {
  console.log(`[sync ${new Date().toISOString().slice(11, 19)}]`, ...m);
}

function todayAlmaty(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Almaty' }).format(new Date());
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastRequestAt = 0;

async function politePause() {
  const gap = 1000 + Math.random() * 1000;
  const wait = lastRequestAt + gap - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

type FetchOpts = { referer?: string; method?: 'GET' | 'POST'; body?: unknown; accept?: 'json' | 'html' };

async function request(url: string, opts: FetchOpts = {}): Promise<{ text: string; finalUrl: string }> {
  const cacheKey = createHash('sha1').update(`${opts.method ?? 'GET'} ${url} ${JSON.stringify(opts.body ?? '')}`).digest('hex');
  const cacheFile = path.join(CACHE, `${cacheKey}.json`);
  if (USE_CACHE && existsSync(cacheFile)) {
    const c = JSON.parse(readFileSync(cacheFile, 'utf8')) as { at: number; text: string; finalUrl: string };
    if (Date.now() - c.at < 6 * 3600_000) return c;
  }
  const headers: Record<string, string> = {
    'User-Agent': UA,
    'Accept-Language': 'ru-RU,ru;q=0.9',
    Accept: opts.accept === 'html' ? 'text/html,application/xhtml+xml' : 'application/json, text/*',
    'X-KS-City': CITY_ID,
  };
  if (opts.referer) headers.Referer = opts.referer;
  if (opts.body) headers['Content-Type'] = 'application/json; charset=UTF-8';

  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      const backoff = 2000 * 2 ** attempt + Math.random() * 1000;
      log(`повтор ${attempt} через ${Math.round(backoff / 1000)} с: ${url}`);
      await sleep(backoff);
    }
    await politePause();
    try {
      const res = await fetch(url, {
        method: opts.method ?? 'GET',
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        redirect: 'follow',
        signal: AbortSignal.timeout(20_000),
      });
      if (res.status === 404) throw new SyncError(`404: ${url}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
      const text = await res.text();
      const out = { text, finalUrl: res.url };
      mkdirSync(CACHE, { recursive: true });
      writeFileSync(cacheFile, JSON.stringify({ at: Date.now(), ...out }));
      return out;
    } catch (e) {
      if (e instanceof SyncError) throw e;
      lastErr = e;
    }
  }
  throw new Error(`Kaspi не ответил после 4 попыток: ${url}. Последняя ошибка: ${String(lastErr)}`);
}

function readJson<T>(file: string, schema: z.ZodType<T>): T | null {
  const p = path.join(OUT, file);
  if (!existsSync(p)) return null;
  return schema.parse(JSON.parse(readFileSync(p, 'utf8')));
}

function sortKeys<T>(rec: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(rec).sort(([a], [b]) => a.localeCompare(b)));
}

/** Пишет файл только если содержимое изменилось - так коммит в CI будет только при реальных изменениях. */
function writeIfChanged(file: string, data: unknown): boolean {
  const p = path.join(OUT, file);
  const next = `${JSON.stringify(data, null, 1)}\n`;
  if (existsSync(p) && readFileSync(p, 'utf8') === next) return false;
  if (DRY) {
    log(`[dry-run] изменился бы ${file}`);
    return true;
  }
  mkdirSync(path.dirname(p), { recursive: true });
  const tmp = `${p}.tmp`;
  writeFileSync(tmp, next);
  renameSync(tmp, p);
  return true;
}

type Mapping = { codes: Set<string>; byCode: Map<string, { model: string }> };

function loadMapping(): Mapping {
  const catalog = z
    .object({ models: z.array(z.object({ slug: z.string(), variants: z.array(z.object({ kaspiCode: z.string() })) })) })
    .parse(JSON.parse(readFileSync(path.join(ROOT, 'content/catalog.json'), 'utf8')));
  const byCode = new Map<string, { model: string }>();
  for (const m of catalog.models) for (const v of m.variants) byCode.set(v.kaspiCode, { model: m.slug });
  return { codes: new Set(byCode.keys()), byCode };
}

function seedUrls(): Map<string, string> {
  const seed = z
    .object({ variants: z.array(z.object({ kaspiCode: z.string(), kaspiUrl: z.string() })) })
    .parse(JSON.parse(readFileSync(path.join(ROOT, 'data/catalog-seed.json'), 'utf8')));
  return new Map(seed.variants.map((v) => [v.kaspiCode, v.kaspiUrl]));
}

async function fetchListing(): Promise<ListingItem[]> {
  const items: ListingItem[] = [];
  for (let page = 0; page < 12; page++) {
    const url = `https://kaspi.kz/yml/product-view/pl/results?page=${page}&q=%3AallMerchants%3A${MERCHANT_ID}&text&sort=price-asc&qs&c=${CITY_ID}&ui=d&i=-1`;
    const { text } = await request(url, { referer: `https://kaspi.kz/shop/m/${MERCHANT_ID}/products` });
    const parsed = rawListingSchema.safeParse(JSON.parse(text));
    if (!parsed.success) throw new SyncError(`Сломался формат листинга Kaspi (страница ${page}): ${parsed.error.message}`);
    if (parsed.data.data.length === 0) break;
    items.push(...parsed.data.data.map(parseListingItem));
  }
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.kaspiCode) ? false : (seen.add(i.kaspiCode), true)));
}

async function hasOffers(code: string, referer: string): Promise<{ price: number } | null> {
  const body = {
    cityId: CITY_ID,
    id: code,
    merchantUID: [],
    limit: 5,
    page: 0,
    sortOption: 'PRICE',
    highRating: null,
    searchText: null,
    isExcellentMerchant: false,
    zoneId: ['Magnum_ZONE1'],
    installationId: '-1',
  };
  const { text } = await request(`https://kaspi.kz/yml/offer-view/offers/${code}`, { method: 'POST', body, referer });
  const parsed = z
    .object({ offers: z.array(z.object({ merchantId: z.string(), price: z.number() })) })
    .safeParse(JSON.parse(text));
  if (!parsed.success) throw new SyncError(`Сломался формат offers Kaspi для ${code}`);
  const own = parsed.data.offers.find((o) => o.merchantId === MERCHANT_ID);
  return own ? { price: own.price } : null;
}

async function fetchProduct(code: string, url: string): Promise<KaspiProduct> {
  const { text, finalUrl } = await request(`${url}?c=${CITY_ID}`, { accept: 'html' });
  const raw = rawItemSchema.safeParse(extractBackendComponent(text, 'item'));
  if (!raw.success) throw new SyncError(`Сломался формат карточки Kaspi ${code}: ${raw.error.message}`);
  if (raw.data.card.id !== code) throw new SyncError(`Карточка ${code} отдала товар ${raw.data.card.id}`);
  const clean = new URL(finalUrl);
  clean.search = '';
  return parseProduct(raw.data, clean.toString());
}

async function fetchReviewsFor(code: string, referer: string, prevModelName: string | null): Promise<ReviewsFile> {
  const byId = new Map<string, Review>();
  let first: RawReviews | null = null;
  let modelName = prevModelName;
  for (const filter of ['COMMENT', 'PICTURE'] as const) {
    for (let page = 0; page < 40; page++) {
      const url = `https://kaspi.kz/yml/review-view/api/v1/reviews/product/${code}?baseProductCode&orderCode&filter=${filter}&sort=POPULARITY&limit=${REVIEWS_PAGE}&merchantCodes&withAgg=true&page=${page}`;
      const { text } = await request(url, { referer });
      const parsed = rawReviewsSchema.safeParse(JSON.parse(text));
      if (!parsed.success) throw new SyncError(`Сломался формат отзывов Kaspi ${code}: ${parsed.error.message}`);
      first ??= parsed.data;
      for (const r of parsed.data.data) {
        modelName ??= r.product?.name ?? null;
        const review = parseReview(r, code);
        if (!review.text && !review.plus && !review.minus && review.photos.length === 0) continue;
        byId.set(review.id, review);
      }
      const total = groupTotal(parsed.data, filter);
      if (parsed.data.data.length < REVIEWS_PAGE || (page + 1) * REVIEWS_PAGE >= total) break;
    }
    if (first && groupTotal(first, 'PICTURE') === 0) break;
  }
  const f = first;
  const reviews = [...byId.values()].sort((a, b) => b.helpfulCount - a.helpfulCount || b.date.localeCompare(a.date));
  return {
    kaspiCode: code,
    kaspiModelName: modelName,
    ratingCount: f ? groupTotal(f, 'ALL') : 0,
    commentCount: f ? groupTotal(f, 'COMMENT') : 0,
    pictureCount: f ? groupTotal(f, 'PICTURE') : 0,
    ratingAvg: f && groupTotal(f, 'ALL') > 0 ? (f.summary?.global ?? null) : null,
    distribution: f ? distributionOf(f) : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    reviews,
  };
}

async function fetchMerchant(today: string): Promise<MerchantFile> {
  const { text } = await request(`https://kaspi.kz/shop/m/${MERCHANT_ID}/products?c=${CITY_ID}`, { accept: 'html' });
  const raw = rawMerchantSchema.safeParse(extractBackendComponent(text, 'merchant'));
  if (!raw.success) throw new SyncError(`Сломался формат данных магазина Kaspi: ${raw.error.message}`);
  const seg = raw.data.merchantMetrics?.orderStatistics?.ordersTotalSegment;
  return {
    syncedAt: today,
    merchantId: raw.data.uid,
    name: raw.data.name,
    createdAt: raw.data.created.slice(0, 10),
    ordersSegment: seg && /^\d+$/.test(seg) ? Number(seg) : null,
  };
}

/** Добавляет в OPEN-QUESTIONS.md пункт «нужен маппинг» для новых SKU, если его ещё нет. */
function noteUnmappedInQuestions(items: UnmappedItem[]) {
  if (items.length === 0 || DRY) return;
  const file = path.join(ROOT, 'OPEN-QUESTIONS.md');
  let text = readFileSync(file, 'utf8');
  const fresh = items.filter((i) => !text.includes(`нужен маппинг: ${i.kaspiCode}`));
  if (fresh.length === 0) return;
  const block = fresh
    .map(
      (i) =>
        `\n### Нужен маппинг: ${i.kaspiCode}\n- Что нужно: решить, к какой модели и расцветке относится новый SKU Kaspi «${i.title}» (${i.url}). Маркер: нужен маппинг: ${i.kaspiCode}.\n- Зачем: без маппинга товар показывается отдельной карточкой с названием Kaspi.\n- Сейчас: в \`data/kaspi/unmapped.json\`, на сайте отдельной карточкой, категория по типу товара Kaspi (${i.kaspiCategory ?? 'не определена'}).\n- Разблокирует: товар в нужной карточке модели. Делается правкой \`content/catalog.json\`.\n`,
    )
    .join('');
  text = text.replace('\n## Закрыто', `${block}\n## Закрыто`);
  writeFileSync(file, text);
  log(`OPEN-QUESTIONS.md: добавлено пунктов «нужен маппинг»: ${fresh.length}`);
}

async function main() {
  const today = todayAlmaty();
  const mapping = loadMapping();
  const seeds = seedUrls();
  const prevListing = readJson('listing.json', listingFileSchema);
  const prevProducts = readJson('products.json', productsFileSchema);
  const prevUnmapped = readJson('unmapped.json', unmappedFileSchema) ?? [];
  const prevMeta = readJson('meta.json', metaFileSchema);

  log(`режим: ${MODE}${ONLY ? `, только ${ONLY.join(',')}` : ''}${USE_CACHE ? ', кэш' : ''}${DRY ? ', dry-run' : ''}`);

  // 1. Листинг: цены, рассрочка, бонусы, наличие.
  const listing = await fetchListing();
  log(`листинг: ${listing.length} SKU`);
  const guard = checkListing(listing, mapping.codes);
  if (!guard.ok) throw new SyncError(guard.reason);
  const missing = guard.missing;

  // 2. Пропавшие SKU: проверяем offers, прежде чем ставить «нет в наличии».
  const items: Record<string, ListingItem> = {};
  for (const i of listing) items[i.kaspiCode] = i;
  for (const code of missing) {
    const prev = prevListing?.items[code];
    const url = prev?.url ?? seeds.get(code);
    if (!url) continue;
    const offer = await hasOffers(code, url).catch((e: unknown) => {
      log(`offers ${code}: ${String(e)}`);
      return null;
    });
    log(`SKU ${code} нет в листинге, offers: ${offer ? `есть, ${offer.price} ₸` : 'нет'}`);
    const base: ListingItem = prev ?? {
      kaspiCode: code,
      title: '',
      url,
      price: offer?.price ?? 1,
      priceBeforeDiscount: offer?.price ?? 1,
      bonus: 0,
      creditMonthlyPrice: null,
      creditMonths: null,
      inStock: false,
      rating: null,
      reviewsCount: 0,
      kaspiCategory: null,
    };
    items[code] = { ...base, inStock: Boolean(offer), price: offer?.price ?? base.price };
  }

  // 3. Новые SKU, которых нет в маппинге.
  const unmappedNow = listing.filter((i) => !mapping.codes.has(i.kaspiCode));
  const unmapped: UnmappedItem[] = unmappedNow.map((i) => ({
    kaspiCode: i.kaspiCode,
    title: i.title,
    url: i.url,
    kaspiCategory: i.kaspiCategory,
    firstSeen: prevUnmapped.find((p) => p.kaspiCode === i.kaspiCode)?.firstSeen ?? today,
  }));
  if (unmapped.length) log(`новые SKU без маппинга: ${unmapped.map((u) => u.kaspiCode).join(', ')}`);

  const listingFile: ListingFile = listingFileSchema.parse({ syncedAt: today, items: sortKeys(items) });

  // 4. Полный срез: магазин, карточки, отзывы.
  let productsFile: ProductsFile | null = null;
  let merchantFile: MerchantFile | null = null;
  const reviewsFiles: ReviewsFile[] = [];
  if (MODE === 'full') {
    merchantFile = merchantFileSchema.parse(await fetchMerchant(today));
    log(`магазин: на Kaspi с ${merchantFile.createdAt}, сегмент заказов ${merchantFile.ordersSegment}`);

    const codes = [...new Set([...mapping.codes, ...unmapped.map((u) => u.kaspiCode)])].filter((c) => !ONLY || ONLY.includes(c));
    const products: Record<string, KaspiProduct> = { ...(prevProducts?.items ?? {}) };
    let failed = 0;
    for (const [n, code] of codes.entries()) {
      const url = items[code]?.url ?? prevProducts?.items[code]?.url ?? seeds.get(code);
      if (!url) continue;
      try {
        const p = await fetchProduct(code, url);
        products[code] = p;
        log(`карточка ${n + 1}/${codes.length} ${code}: ${p.images.length} фото, ${p.kaspiModelName ?? 'без имени модели'}`);
      } catch (e) {
        if (e instanceof SyncError && !String(e.message).startsWith('404')) throw e;
        failed++;
        log(`карточка ${code} не получена (${String(e)}), оставляем прошлый срез`);
      }
      try {
        const prevRev = readJson(`reviews/${code}.json`, reviewsFileSchema);
        const rev = await fetchReviewsFor(code, url, products[code]?.kaspiModelName ?? prevRev?.kaspiModelName ?? null);
        reviewsFiles.push(reviewsFileSchema.parse(rev));
        log(`  отзывы ${code}: оценок ${rev.ratingCount}, с текстом ${rev.commentCount}, с фото ${rev.pictureCount}, сохранено ${rev.reviews.length}`);
      } catch (e) {
        if (e instanceof SyncError) throw e;
        failed++;
        log(`отзывы ${code} не получены (${String(e)}), оставляем прошлый срез`);
      }
    }
    if (codes.length && failed / (codes.length * 2) > MAX_MISSING_SHARE) {
      throw new SyncError(`Не получено ${failed} из ${codes.length * 2} запросов карточек и отзывов - данные не обновлены.`);
    }
    for (const p of Object.values(products)) {
      p.kaspiModelName ??= reviewsFiles.find((r) => r.kaspiCode === p.kaspiCode)?.kaspiModelName ?? null;
    }
    productsFile = productsFileSchema.parse({ syncedAt: today, items: sortKeys(products) });
  }

  // 5. Запись: только после того, как всё собрано и прошло схемы.
  const meta: MetaFile = metaFileSchema.parse({
    pricesSyncedAt: today,
    fullSyncedAt: MODE === 'full' ? today : (prevMeta?.fullSyncedAt ?? null),
    skuCount: Object.keys(items).length,
    missingSkus: missing,
  });
  const changed: string[] = [];
  if (writeIfChanged('listing.json', listingFile)) changed.push('listing.json');
  if (writeIfChanged('unmapped.json', unmapped)) changed.push('unmapped.json');
  if (productsFile && writeIfChanged('products.json', productsFile)) changed.push('products.json');
  if (merchantFile && writeIfChanged('merchant.json', merchantFile)) changed.push('merchant.json');
  for (const r of reviewsFiles) if (writeIfChanged(`reviews/${r.kaspiCode}.json`, r)) changed.push(`reviews/${r.kaspiCode}.json`);
  if (writeIfChanged('meta.json', meta)) changed.push('meta.json');
  noteUnmappedInQuestions(unmapped);
  log(changed.length ? `изменено файлов: ${changed.length} (${changed.slice(0, 8).join(', ')}${changed.length > 8 ? ', ...' : ''})` : 'изменений нет');
}

main().catch((e: unknown) => {
  console.error(`\nСИНХРОНИЗАЦИЯ ПРЕРВАНА: ${e instanceof Error ? e.message : String(e)}`);
  console.error('Старые данные в data/kaspi/ не тронуты.');
  process.exit(1);
});
