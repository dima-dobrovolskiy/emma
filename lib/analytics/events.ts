'use client';

/*
 * События аналитики. Всё пишется в window.dataLayer (туда позже подключится Каспи-трекер),
 * плюс дублируется в счётчики, если они загружены. Без ID счётчиков код ничего не ломает.
 */

export type AnalyticsEvent =
  | { name: 'kaspi_click'; params: { model: string; variant: string; kaspiCode: string; price: number; placement: string } }
  | { name: 'variant_select'; params: { model: string; variant: string; kaspiCode: string } }
  | { name: 'quiz_start'; params: Record<string, never> }
  | { name: 'quiz_complete'; params: { result: string } }
  | { name: 'guide_to_product'; params: { guide: string; model: string } }
  | { name: 'filter_use'; params: { filter: string; value: string; page: string } };

type W = Window & {
  dataLayer?: unknown[];
  gtag?: (...a: unknown[]) => void;
  ym?: (...a: unknown[]) => void;
  fbq?: (...a: unknown[]) => void;
};

export function track<E extends AnalyticsEvent>(name: E['name'], params: E['params']): void {
  if (typeof window === 'undefined') return;
  const w = window as W;
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({ event: name, ...params });
  try {
    w.gtag?.('event', name, params);
    const ymId = process.env.NEXT_PUBLIC_YM_ID;
    if (ymId) w.ym?.(Number(ymId), 'reachGoal', name, params);
    if (name === 'kaspi_click') {
      const p = params as { price: number; kaspiCode: string };
      w.fbq?.('track', 'InitiateCheckout', { value: p.price, currency: 'KZT', content_ids: [p.kaspiCode] });
    } else {
      w.fbq?.('trackCustom', name, params);
    }
  } catch {
    // счётчик упал - сайт продолжает работать
  }
}
