import type { Faq as FaqItem } from '@/lib/catalog';
import { t } from '@/lib/i18n';
import { JsonLd } from './JsonLd';

export function Faq({ items, title = t('common.faq'), id = 'faq' }: { items: FaqItem[]; title?: string; id?: string }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby={`${id}-title`} className="py-10">
      <h2 id={`${id}-title`} className="mb-5 text-2xl md:text-3xl">
        {title}
      </h2>
      <div className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
        {items.map((f) => (
          <details key={f.q} className="group px-5">
            <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
              {f.q}
              <span aria-hidden="true" className="shrink-0 text-xl text-ink-3 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pb-5 text-ink-2">{f.a}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        }}
      />
    </section>
  );
}
