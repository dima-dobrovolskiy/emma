import { describe, expect, it } from 'vitest';
import { checkListing } from '@/lib/kaspi/guard';
import type { ListingItem } from '@/lib/kaspi/schema';

const item = (code: string, price = 27990): ListingItem => ({
  kaspiCode: code,
  title: 't',
  url: `https://kaspi.kz/shop/p/x-${code}/`,
  price,
  priceBeforeDiscount: price,
  bonus: 0,
  creditMonthlyPrice: '2 333 ₸',
  creditMonths: 12,
  inStock: true,
  rating: 5,
  reviewsCount: 1,
  kaspiCategory: null,
});
const mapped = new Set(Array.from({ length: 10 }, (_, i) => String(i)));

describe('защита синхронизации', () => {
  it('цена 0 - сбой', () => {
    const r = checkListing([...mapped].map((c) => item(c, c === '3' ? 0 : 27990)), mapped);
    expect(r.ok).toBe(false);
  });
  it('пропало больше 30% SKU - сбой', () => {
    expect(checkListing([...mapped].slice(0, 6).map((c) => item(c)), mapped).ok).toBe(false);
  });
  it('пропало 30% и меньше - не сбой, пропавшие перечислены', () => {
    const r = checkListing([...mapped].slice(0, 7).map((c) => item(c)), mapped);
    expect(r).toEqual({ ok: true, missing: ['7', '8', '9'] });
  });
  it('пропавшие раньше SKU не считаются новым сбоем', () => {
    const r = checkListing([...mapped].slice(0, 6).map((c) => item(c)), mapped, { prevMissing: ['6', '7', '8', '9'] });
    expect(r).toEqual({ ok: true, missing: ['6', '7', '8', '9'] });
  });
  it('acceptMissing принимает разовое снятие больше 30%', () => {
    const r = checkListing([...mapped].slice(0, 5).map((c) => item(c)), mapped, { acceptMissing: true });
    expect(r.ok).toBe(true);
  });
});
