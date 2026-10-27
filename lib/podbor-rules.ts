/*
 * Правила подбора и фильтров по возрасту и весу. Чистые функции - работают и на сервере, и в браузере.
 * Главное правило: модель с максимальным весом ниже веса ребёнка не предлагается никогда.
 */

export type AgeOption = { id: string; fromMonths: number; toMonths: number };
export type WeightOption = { id: string; fromKg: number; toKg: number };
export type Where = 'home' | 'walks' | 'travel' | 'winter';

export type RangeFacets = { ageFrom: number | null; ageTo: number | null; weightFrom: number | null; weightTo: number | null };

/** Возраст: минимальный возраст модели не позже середины диапазона, максимальный - не раньше его начала. */
export function matchAge(m: RangeFacets, a: AgeOption): boolean {
  const from = m.ageFrom ?? 0;
  const to = m.ageTo ?? Infinity;
  const mid = (a.fromMonths + a.toMonths) / 2;
  return from <= mid && to > a.fromMonths;
}

/**
 * Вес: максимальный вес модели не ниже верхней границы диапазона (ребёнок может весить и 18 кг в диапазоне 14-18),
 * минимальный вес модели - не выше середины диапазона. Без данных о максимальном весе модель не предлагаем.
 */
export function matchWeight(m: RangeFacets, w: WeightOption): boolean {
  if (m.weightTo === null) return false;
  const mid = (w.fromKg + w.toKg) / 2;
  return m.weightTo >= w.toKg && (m.weightFrom === null || m.weightFrom <= mid);
}

export type PodborModel = RangeFacets & {
  slug: string;
  name: string;
  uses: Where[];
  reviews: number;
  rating: number | null;
  minPrice: number;
  /** Максимальный вес для подписи - как на карточке модели. Для отбора используется weightTo. */
  shownMaxKg?: number | null;
  credit?: string | null;
};

export type PodborResult = {
  main: PodborModel[];
  winterAddon: PodborModel[];
};

export function podbor(
  models: PodborModel[],
  addons: PodborModel[],
  answer: { age: AgeOption; weight: WeightOption; where: Where },
  maxResults = 3,
): PodborResult {
  const fits = models.filter((m) => matchAge(m, answer.age) && matchWeight(m, answer.weight));
  const score = (m: PodborModel) => (m.uses.includes(answer.where) ? 1000 : 0) + Math.log10(1 + m.reviews) * 10 + (m.rating ?? 0);
  const main = fits.sort((a, b) => score(b) - score(a)).slice(0, maxResults);
  const winterAddon = answer.where === 'winter' && main.length ? addons.filter((a) => a.weightTo === null || a.weightTo >= answer.weight.toKg).slice(0, 1) : [];
  return { main, winterAddon };
}
