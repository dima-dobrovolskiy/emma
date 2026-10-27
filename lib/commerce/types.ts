/*
 * Этап 4 (своя корзина и оплата) - только интерфейсы.
 * Сейчас единственная реализация - KaspiRedirectCheckout: покупка = переход на карточку расцветки в Kaspi.
 */

export type PurchasableVariant = {
  kaspiCode: string;
  kaspiUrl: string;
  price: number;
  inStock: boolean;
};

export type BuyAction =
  | { kind: 'external'; href: string; target: '_blank'; rel: string }
  | { kind: 'cart'; variantId: string };

export interface CheckoutProvider {
  readonly id: 'kaspi' | 'own';
  /** Что делает кнопка покупки для расцветки. */
  buyAction(variant: PurchasableVariant): BuyAction;
  /** Подпись под кнопкой - ключ словаря messages. */
  readonly noteKey: 'buy.note';
}
