import type { Model } from './catalog';
import type { ListingFacets } from '@/components/category/CategoryListing';

export function listingFacets(m: Model): ListingFacets {
  return {
    slug: m.slug,
    order: m.order,
    minPrice: m.minPrice,
    rating: m.ratingAvg,
    reviews: m.reviewsCount,
    ageFrom: m.ageRange?.from ?? null,
    ageTo: m.ageRange?.to ?? null,
    weightFrom: m.weightRange?.from ?? null,
    weightTo: m.weightRange?.to ?? null,
    carry: m.carryPositions,
    colors: [...new Set(m.variants.filter((v) => v.inStock).map((v) => v.colorFamily))],
    seasons: m.seasons,
  };
}
