/* Мелкие помощники для текста и разбора значений характеристик Kaspi. */

export function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

export function capitalize(s: string): string {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s;
}

function toMonths(n: number, unit: string | undefined): number {
  return unit && /год|лет|г\b/.test(unit) ? Math.round(n * 12) : n;
}

/**
 * Возраст из характеристик Kaspi в месяцах:
 * «с 2 месяцев» → {from: 2}, «с 3мес до 2 лет» → {from: 3, to: 24}, «до 2 лет» → {to: 24},
 * «0-2 лет» → {from: 0, to: 24}, «3+» → {from: 3}, «От рождения» → {from: 0}.
 */
export function parseAgeRange(value: string): { from: number | null; to: number | null } | null {
  const v = value.toLowerCase().replace(/,/g, '.').replace(/\s+/g, ' ');
  const num = '(\\d+(?:\\.\\d+)?)';
  const unit = '\\s*(мес\\w*|год\\w*|лет|г\\b)?';
  let from: number | null = null;
  let to: number | null = null;
  if (/рожден/.test(v)) from = 0;
  const range = new RegExp(`${num}${unit}\\s*-\\s*${num}${unit}`).exec(v);
  const toM = new RegExp(`до\\s*${num}${unit}`).exec(v);
  if (range && !toM) {
    const u = range[4] ?? range[2];
    return { from: toMonths(Number(range[1]), range[2] ?? u), to: toMonths(Number(range[3]), u) };
  }
  if (range && toM) from = toMonths(Number(range[1]), range[2] ?? range[4]);
  const fromM = new RegExp(`(?:^|\\s|с|от)\\s*${num}${unit}\\s*\\+?`).exec(v.replace(/до .*/, ''));
  if (fromM && from === null && !/^до/.test(v.trim())) from = toMonths(Number(fromM[1]), fromM[2]);
  if (toM) to = toMonths(Number(toM[1]), toM[2] ?? 'лет');
  return from === null && to === null ? null : { from, to };
}

/** Чистит возраст из Kaspi для показа: «3мес +» → «3 мес+», «0&#43;» уже раскодирован в «0+». */
export function prettyAge(value: string): string {
  return value
    .replace(/(\d)(мес|год|лет)/gi, '$1 $2')
    .replace(/\s+\+/g, '+')
    .replace(/\s+/g, ' ')
    .trim();
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
