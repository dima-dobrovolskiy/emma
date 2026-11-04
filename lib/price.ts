/*
 * Цена в том виде, как её показывает Kaspi: «-11%», «0·0·12», зачёркнутая старая цена.
 * Всё считается из данных синхронизации, ничего не хардкодится: срок рассрочки у товаров разный (3, 6, 12 мес).
 */

export type PriceInfo = {
  price: number;
  priceBeforeDiscount: number;
  creditMonthlyPrice: string | null;
  creditMonths: number | null;
};

/** Скидка в процентах от зачёркнутой цены: 30 900 вместо 34 900 - 11%. Нет скидки - 0. */
export function discountPercent(p: PriceInfo): number {
  if (!(p.priceBeforeDiscount > p.price) || p.price <= 0) return 0;
  return Math.round(((p.priceBeforeDiscount - p.price) / p.priceBeforeDiscount) * 100);
}

/**
 * Срок рассрочки 0-0-N: платёж × срок равен цене, переплаты нет. Kaspi округляет платёж вверх до тенге,
 * поэтому сумма может быть больше цены меньше чем на срок в тенге (2 834 × 12 = 34 008 при цене 34 000).
 * Если сумма не сходится - это кредит, а не 0-0-N, и метку не показываем.
 */
export function installmentTerm(p: PriceInfo): number | null {
  if (!p.creditMonthlyPrice || !p.creditMonths) return null;
  const monthly = Number(p.creditMonthlyPrice.replace(/\D/g, ''));
  if (!monthly) return null;
  const over = monthly * p.creditMonths - p.price;
  return over >= 0 && over < p.creditMonths ? p.creditMonths : null;
}
