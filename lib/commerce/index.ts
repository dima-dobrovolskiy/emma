import { KaspiRedirectCheckout } from './kaspi';
import type { CheckoutProvider } from './types';

export type { CheckoutProvider, BuyAction, PurchasableVariant } from './types';

/** Провайдер покупки из конфига. Своя оплата (этап 4) появится здесь же. */
export function getCheckoutProvider(id: string | undefined = process.env.CHECKOUT_PROVIDER): CheckoutProvider {
  switch (id) {
    case undefined:
    case '':
    case 'kaspi':
      return new KaspiRedirectCheckout();
    default:
      throw new Error(`Неизвестный CHECKOUT_PROVIDER: ${id}. Доступно: kaspi`);
  }
}
