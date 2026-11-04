import type { Model } from '@/lib/catalog';
import { t } from '@/lib/i18n';
import { specSections } from '@/lib/specs';

/** Характеристики из Kaspi, сгруппированные. */
export function Specs({ model }: { model: Model }) {
  const groups = specSections(model);
  if (!groups.length) return null;
  return (
    <section aria-labelledby="specs">
      <h2 id="specs" className="h-section mb-5">
        {t('model.specs')}
      </h2>
      {groups.map((g) => (
        <div key={g.name || 'main'} className="mb-4">
          <dl className="divide-y divide-line border-y border-line">
            {g.rows.map((f) => (
              <div key={f.name} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 py-2.5 text-[0.9375rem]">
                <dt className="text-ink-3">{f.name}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      <p className="text-sm text-ink-3">{t('model.specsSource')}</p>
    </section>
  );
}
