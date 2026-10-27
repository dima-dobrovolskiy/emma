'use client';

import { setUrlParams, useUrlParam } from '@/lib/hooks';
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics/events';

type Item = { kaspiCode: string; designSlug: string; designName: string; inStock: boolean; price: string };

/** Список «Все расцветки» в боковой колонке: выбирает расцветку на этой же странице и возвращает к фото и кнопке покупки. */
export function ColorList({ modelSlug, defaultSlug, items }: { modelSlug: string; defaultSlug: string; items: Item[] }) {
  const current = useUrlParam('color') ?? defaultSlug;
  return (
    <ul className="mt-3 space-y-1 text-sm">
      {items.map((v) => (
        <li key={v.kaspiCode}>
          <a
            href={`?color=${v.designSlug}`}
            aria-current={v.designSlug === current ? 'true' : undefined}
            onClick={(e) => {
              e.preventDefault();
              setUrlParams({ color: v.designSlug });
              track('variant_select', { model: modelSlug, variant: v.designSlug, kaspiCode: v.kaspiCode, placement: 'list' });
              const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              document.getElementById('model-view')?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
            }}
            className="flex min-h-[44px] items-center justify-between gap-3 rounded-lg px-2 hover:bg-sand aria-[current=true]:bg-sand aria-[current=true]:font-semibold"
          >
            <span>{v.designName}</span>
            <span className={v.inStock ? 'text-ink-2' : 'text-ink-3'}>{v.inStock ? v.price : t('common.outOfStock')}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
