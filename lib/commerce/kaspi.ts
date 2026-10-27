import type { BuyAction, CheckoutProvider, PurchasableVariant } from './types';

export class KaspiRedirectCheckout implements CheckoutProvider {
  readonly id = 'kaspi' as const;
  readonly noteKey = 'buy.note' as const;

  buyAction(variant: PurchasableVariant): BuyAction {
    const url = new URL(variant.kaspiUrl);
    url.searchParams.set('c', '750000000');
    return { kind: 'external', href: url.toString(), target: '_blank', rel: 'noopener' };
  }
}
