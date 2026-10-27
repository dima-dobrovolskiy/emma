import { getAllReviews, getCatalog, getModelReviews, modelDistribution, type Model, type ModelReview } from './catalog';
import type { ReviewDTO } from './reviews-dto';

export function toDTO(r: ModelReview, modelName: string): ReviewDTO {
  return {
    id: r.id,
    author: r.author,
    date: r.date,
    rating: r.rating,
    text: r.text,
    plus: r.plus,
    minus: r.minus,
    photos: r.photos,
    helpful: r.helpfulCount,
    variantSlug: r.designSlug,
    variantName: r.designName,
    modelSlug: r.modelSlug,
    modelName,
  };
}

export function modelReviewsDTO(model: Model): ReviewDTO[] {
  return getModelReviews(model).map((r) => toDTO(r, model.name));
}

export function allReviewsDTO(): ReviewDTO[] {
  const names = new Map(getCatalog().models.map((m) => [m.slug, m.name]));
  return getAllReviews().map((r) => toDTO(r, names.get(r.modelSlug) ?? ''));
}

export function allDistribution(): Record<1 | 2 | 3 | 4 | 5, number> {
  const d = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  for (const m of getCatalog().models) {
    const md = modelDistribution(m);
    for (const k of [1, 2, 3, 4, 5] as const) d[k] += md[k];
  }
  return d;
}
