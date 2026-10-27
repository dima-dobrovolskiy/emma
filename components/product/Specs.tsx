import type { Model } from '@/lib/catalog';
import { t } from '@/lib/i18n';
import { parseWeightKg, prettyAge, prettySpecValue } from '@/lib/text';

// Свободный текст продавца («Дополнительно») не показываем: это дубль описания Kaspi.
const SKIP = new Set(['Дополнительно', 'Цвет']);

/** Характеристики из Kaspi, сгруппированные. Берём расцветку по умолчанию: у расцветок одной модели они совпадают. */
export function Specs({ model }: { model: Model }) {
  const groups = model.defaultVariant.specs
    // «Вес 0 кг» у части товаров Kaspi - ошибка заполнения, такую строку не показываем.
    .map((g) => ({ ...g, features: g.features.filter((f) => !SKIP.has(f.name) && !(f.name === 'Вес' && f.values.every((v) => parseWeightKg(v) === 0))) }))
    .filter((g) => g.features.length);
  if (!groups.length) return null;
  return (
    <section aria-labelledby="specs">
      <h2 id="specs" className="h-section mb-5">
        {t('model.specs')}
      </h2>
      {groups.map((g) => (
        <div key={g.name || 'main'} className="mb-4">
          <dl className="divide-y divide-line border-y border-line">
            {g.features.map((f) => (
              <div key={f.name} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 py-3 text-[0.9375rem]">
                <dt className="text-ink-3">{f.name}</dt>
                <dd>{f.name.startsWith('Рекомендуемый возраст') ? f.values.map(prettyAge).join(', ') : f.values.map(prettySpecValue).join(', ')}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      <p className="text-sm text-ink-3">{t('model.specsSource')}</p>
    </section>
  );
}
