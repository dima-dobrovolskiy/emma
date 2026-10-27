import type { ListingItem } from './schema';

/*
 * Защита от сбоев синхронизации. Сбой = цена 0 или пропало больше 30% SKU из маппинга.
 * При сбое синхронизация ничего не пишет: остаётся последний удачный срез.
 */

export const MAX_MISSING_SHARE = 0.3;

export type GuardResult = { ok: true; missing: string[] } | { ok: false; reason: string };

export function checkListing(listing: ListingItem[], mappedCodes: Set<string>): GuardResult {
  const zero = listing.filter((i) => !(i.price > 0));
  if (zero.length) return { ok: false, reason: `Цена 0 у SKU: ${zero.map((i) => i.kaspiCode).join(', ')}` };
  const got = new Set(listing.map((i) => i.kaspiCode));
  const missing = [...mappedCodes].filter((c) => !got.has(c));
  if (mappedCodes.size && missing.length / mappedCodes.size > MAX_MISSING_SHARE) {
    return {
      ok: false,
      reason: `Из листинга пропало ${missing.length} из ${mappedCodes.size} SKU (больше ${MAX_MISSING_SHARE * 100}%). Похоже на сбой Kaspi или блокировку - данные не обновлены.`,
    };
  }
  return { ok: true, missing };
}
