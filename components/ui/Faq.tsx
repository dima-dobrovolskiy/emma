import type { Faq as FaqItem } from '@/lib/catalog';
import { t } from '@/lib/i18n';
import { JsonLd } from './JsonLd';

export function Faq({ items, title = t('common.faq'), id = 'faq' }: { items: FaqItem[]; title?: string; id?: string }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby={`${id}-title`} className="py-10 md:py-14 lg:grid lg:grid-cols-12 lg:gap-10">
      <h2 id={`${id}-title`} className="h-section mb-6 lg:sticky lg:top-24 lg:col-span-4 lg:mb-0 lg:self-start">
        {title}
      </h2>
      <div className="space-y-2 lg:col-span-8">
        {items.map((f) => (
          <details key={f.q} className="group rounded-[var(--radius-card)] bg-sand">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-semibold md:px-5 [&::-webkit-details-marker]:hidden">
              {f.q}
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" className="shrink-0 text-ink-3 transition-transform duration-300 ease-out group-open:rotate-180">
                <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <p className="max-w-[62ch] px-4 pb-4 text-ink-2 md:px-5">{f.a}</p>
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
