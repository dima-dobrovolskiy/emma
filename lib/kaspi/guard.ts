import type { ListingItem } from './schema';

/*
 * Защита от сбоев синхронизации. Сбой = цена 0 или из листинга разом пропало больше 30% SKU,
 * которые были в нём в прошлый удачный раз. SKU, пропавшие раньше (meta.json, missingSkus), не считаются:
 * иначе после того, как магазин убрал часть товаров, синхронизация падала бы каждый час.
 * Если товары действительно сняты с Kaspi, разовый запуск с acceptMissing принимает новый срез.
 * При сбое синхронизация ничего не пишет: остаётся последний удачный срез.
 */

export const MAX_MISSING_SHARE = 0.3;

export type GuardResult = { ok: true; missing: string[] } | { ok: false; reason: string };

export function checkListing(
  listing: ListingItem[],
  mappedCodes: Set<string>,
  opts: { prevMissing?: string[]; acceptMissing?: boolean } = {},
): GuardResult {
  const zero = listing.filter((i) => !(i.price > 0));
  if (zero.length) return { ok: false, reason: `Цена 0 у SKU: ${zero.map((i) => i.kaspiCode).join(', ')}` };
  const got = new Set(listing.map((i) => i.kaspiCode));
  const missing = [...mappedCodes].filter((c) => !got.has(c));
  const prevMissing = new Set(opts.prevMissing ?? []);
  const baseline = [...mappedCodes].filter((c) => !prevMissing.has(c));
  const newlyMissing = missing.filter((c) => !prevMissing.has(c));
  if (!opts.acceptMissing && baseline.length && newlyMissing.length / baseline.length > MAX_MISSING_SHARE) {
    return {
      ok: false,
      reason:
        `Из листинга пропало ${newlyMissing.length} из ${baseline.length} SKU (больше ${MAX_MISSING_SHARE * 100}%): ${newlyMissing.join(', ')}. ` +
        'Похоже на сбой Kaspi или блокировку - данные не обновлены. ' +
        'Если товары действительно сняты с Kaspi, запустите синхронизацию вручную с accept_missing.',
    };
  }
  return { ok: true, missing };
}
