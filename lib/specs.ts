import type { Model } from './catalog';
import { parseWeightKg, prettyAge, prettySpecValue } from './text';

// Свободный текст продавца («Дополнительно») не показываем: это дубль описания Kaspi.
const SKIP = new Set(['Дополнительно', 'Цвет']);

export type SpecRow = { name: string; value: string };
export type SpecSection = { name: string; rows: SpecRow[] };

/**
 * Характеристики из Kaspi, сгруппированные и очищенные - как на странице модели.
 * Берём расцветку по умолчанию: у расцветок одной модели они совпадают.
 * Те же строки идут в разметку Product и в llms-full.txt.
 */
export function specSections(model: Model): SpecSection[] {
  return (
    model.defaultVariant.specs
      // «Вес 0 кг» у части товаров Kaspi - ошибка заполнения, такую строку не показываем.
      .map((g) => ({
        name: g.name,
        rows: g.features
          .filter((f) => !SKIP.has(f.name) && !(f.name === 'Вес' && f.values.every((v) => parseWeightKg(v) === 0)))
          .map((f) => ({
            name: f.name,
            value: f.name.startsWith('Рекомендуемый возраст') ? f.values.map(prettyAge).join(', ') : f.values.map(prettySpecValue).join(', '),
          })),
      }))
      .filter((g) => g.rows.length)
  );
}
