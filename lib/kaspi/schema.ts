import { z } from 'zod';

/*
 * Схемы данных слоя Kaspi (data/kaspi/*.json).
 * Файлы пишет только scripts/sync-kaspi.ts, руками их не правим.
 */

export const imageSchema = z.object({
  small: z.url(),
  medium: z.url(),
  large: z.url(),
});
export type KaspiImage = z.infer<typeof imageSchema>;

export const listingItemSchema = z.object({
  kaspiCode: z.string(),
  title: z.string(),
  url: z.url(),
  price: z.number().positive(),
  priceBeforeDiscount: z.number().positive(),
  bonus: z.number().nonnegative(),
  /** Строка как отдаёт Kaspi, например «2 333 ₸» */
  creditMonthlyPrice: z.string().nullable(),
  creditMonths: z.number().int().positive().nullable(),
  inStock: z.boolean(),
  rating: z.number().min(0).max(5).nullable(),
  reviewsCount: z.number().int().nonnegative(),
  kaspiCategory: z.string().nullable(),
});
export type ListingItem = z.infer<typeof listingItemSchema>;

export const listingFileSchema = z.object({
  syncedAt: z.string(),
  items: z.record(z.string(), listingItemSchema),
});
export type ListingFile = z.infer<typeof listingFileSchema>;

export const specFeatureSchema = z.object({ name: z.string(), values: z.array(z.string()) });
export const specGroupSchema = z.object({ name: z.string(), features: z.array(specFeatureSchema) });
export type SpecGroup = z.infer<typeof specGroupSchema>;

export const productSchema = z.object({
  kaspiCode: z.string(),
  title: z.string(),
  url: z.url(),
  kaspiModelName: z.string().nullable(),
  kaspiCategory: z.string().nullable(),
  images: z.array(imageSchema),
  videoId: z.string().nullable(),
  specs: z.array(specGroupSchema),
  description: z.string(),
  createdAt: z.string().nullable(),
  /** Цена на карточке Kaspi в момент среза и зачёркнутая цена «до скидки», если она есть. В листинге её нет. */
  price: z.number().positive().nullable().optional(),
  priceBeforeDiscount: z.number().positive().nullable().optional(),
});
export type KaspiProduct = z.infer<typeof productSchema>;

export const productsFileSchema = z.object({
  syncedAt: z.string(),
  items: z.record(z.string(), productSchema),
});
export type ProductsFile = z.infer<typeof productsFileSchema>;

export const reviewSchema = z.object({
  id: z.string(),
  kaspiCode: z.string(),
  author: z.string(),
  date: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string(),
  plus: z.string(),
  minus: z.string(),
  photos: z.array(imageSchema),
  helpfulCount: z.number().int().nonnegative(),
});
export type Review = z.infer<typeof reviewSchema>;

export const reviewsFileSchema = z.object({
  kaspiCode: z.string(),
  kaspiModelName: z.string().nullable(),
  ratingCount: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
  pictureCount: z.number().int().nonnegative(),
  ratingAvg: z.number().min(0).max(5).nullable(),
  distribution: z.object({ 1: z.number(), 2: z.number(), 3: z.number(), 4: z.number(), 5: z.number() }),
  reviews: z.array(reviewSchema),
});
export type ReviewsFile = z.infer<typeof reviewsFileSchema>;

export const merchantFileSchema = z.object({
  syncedAt: z.string(),
  merchantId: z.string(),
  name: z.string(),
  createdAt: z.string(),
  /** Сегмент заказов как отдаёт Kaspi: «10000» значит «больше 10 000» */
  ordersSegment: z.number().int().nonnegative().nullable(),
  /** Рейтинг продавца на странице магазина Kaspi (merchantMetrics.rating), 0-5 */
  rating: z.number().min(0).max(5).nullable().optional(),
});
export type MerchantFile = z.infer<typeof merchantFileSchema>;

export const unmappedItemSchema = z.object({
  kaspiCode: z.string(),
  title: z.string(),
  url: z.url(),
  kaspiCategory: z.string().nullable(),
  firstSeen: z.string(),
});
export const unmappedFileSchema = z.array(unmappedItemSchema);
export type UnmappedItem = z.infer<typeof unmappedItemSchema>;

export const metaFileSchema = z.object({
  pricesSyncedAt: z.string(),
  fullSyncedAt: z.string().nullable(),
  skuCount: z.number().int(),
  missingSkus: z.array(z.string()),
});
export type MetaFile = z.infer<typeof metaFileSchema>;
