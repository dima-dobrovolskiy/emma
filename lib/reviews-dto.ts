import type { KaspiImage } from './kaspi/schema';

/** Отзыв в том виде, в каком он уходит в браузер: только то, что показываем. */
export type ReviewDTO = {
  id: string;
  author: string;
  date: string;
  rating: number;
  text: string;
  plus: string;
  minus: string;
  photos: KaspiImage[];
  helpful: number;
  variantSlug: string;
  variantName: string;
  modelSlug: string;
  modelName: string;
};
