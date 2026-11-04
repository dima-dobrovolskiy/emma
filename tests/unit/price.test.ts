import { describe, expect, it } from 'vitest';
import { discountPercent, installmentTerm } from '@/lib/price';

const base = { price: 30900, priceBeforeDiscount: 30900, creditMonthlyPrice: '2 575 ₸', creditMonths: 12 };

describe('цена как на Kaspi', () => {
  it('скидка считается от зачёркнутой цены', () => {
    expect(discountPercent({ ...base, priceBeforeDiscount: 34900 })).toBe(11);
    expect(discountPercent(base)).toBe(0);
    expect(discountPercent({ ...base, priceBeforeDiscount: 20000 })).toBe(0);
  });

  it('0-0-N только когда платёж × срок сходится с ценой', () => {
    expect(installmentTerm(base)).toBe(12);
    expect(installmentTerm({ ...base, price: 34000, creditMonthlyPrice: '2 834 ₸' })).toBe(12);
    expect(installmentTerm({ ...base, price: 24990, creditMonthlyPrice: '4 165 ₸', creditMonths: 6 })).toBe(6);
    // Платёж с переплатой - это кредит, метку 0-0-N не ставим.
    expect(installmentTerm({ ...base, creditMonthlyPrice: '2 900 ₸' })).toBeNull();
    expect(installmentTerm({ ...base, creditMonthlyPrice: null })).toBeNull();
    expect(installmentTerm({ ...base, creditMonths: null })).toBeNull();
  });
});
