import type { Model } from '@/lib/catalog';
import { t } from '@/lib/i18n';
import { prettyAge } from '@/lib/text';

// Свободный текст продавца («Дополнительно») не показываем: это дубль описания Kaspi.
const SKIP = new Set(['Дополнительно', 'Цвет']);

/** Характеристики из Kaspi, сгруппированные. Берём расцветку по умолчанию: у расцветок одной модели они совпадают. */
export function Specs({ model }: { model: Model }) {
  const groups = model.defaultVariant.specs
    .map((g) => ({ ...g, features: g.features.filter((f) => !SKIP.has(f.name)) }))
    .filter((g) => g.features.length);
  if (!groups.length) return null;
  return (
    <section aria-labelledby="specs">
      <h2 id="specs" className="mb-4 text-2xl md:text-3xl">
        {t('model.specs')}
      </h2>
      {groups.map((g) => (
        <div key={g.name || 'main'} className="mb-4">
          <dl className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            {g.features.map((f) => (
              <div key={f.name} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 px-4 py-3 text-[0.95rem]">
                <dt className="text-ink-2">{f.name}</dt>
                <dd>{f.name.startsWith('Рекомендуемый возраст') ? f.values.map(prettyAge).join(', ') : f.values.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      <p className="text-xs text-ink-3">{t('model.specsSource')}</p>
    </section>
  );
}
