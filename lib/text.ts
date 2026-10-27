/* Мелкие помощники для текста и разбора значений характеристик Kaspi. */

export function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

export function capitalize(s: string): string {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s;
}

/** «с 2 месяцев» → 2, «0-36 мес» → 0, «3+» → 3, «с рождения» → 0, «от 1 года» → 12 */
export function parseAgeMonths(value: string): number | null {
  const v = value.toLowerCase().replace(',', '.');
  if (/рожден/.test(v)) return 0;
  const m = /(\d+(?:\.\d+)?)\s*(?:-\s*\d+(?:\.\d+)?)?\s*(мес|month|год|лет|г\b|\+)?/.exec(v);
  if (!m) return null;
  const n = Number(m[1]);
  if (Number.isNaN(n)) return null;
  if (m[2] && /год|лет|г/.test(m[2])) return Math.round(n * 12);
  return n;
}

/** «18 кг» → 18 */
export function parseWeightKg(value: string): number | null {
  const m = /(\d+(?:[.,]\d+)?)\s*кг/i.exec(value);
  return m ? Number(m[1]!.replace(',', '.')) : null;
}

export function slugify(s: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n',
    о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
    э: 'e', ю: 'yu', я: 'ya',
  };
  return s
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
