import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/catalog';
import { getGuides } from '@/lib/guides';
import { getPages } from '@/lib/pages';
import { absUrl } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const { models, categories, collections, pricesDate } = getCatalog();
  const lastModified = pricesDate;
  return [
    { url: absUrl('/'), lastModified, changeFrequency: 'daily', priority: 1 },
    ...categories
      .filter((c) => c.models.length)
      .map((c) => ({
        url: absUrl(`/c/${c.slug}`),
        lastModified,
        changeFrequency: 'daily' as const,
        priority: 0.8,
        images: c.models.slice(0, 5).flatMap((m) => m.defaultVariant.images.slice(0, 1).map((i) => i.large)),
      })),
    ...collections.map((c) => ({ url: absUrl(`/c/${c.slug}`), lastModified, changeFrequency: 'weekly' as const, priority: 0.6 })),
    // Модели остаются в sitemap, даже если все расцветки закончились.
    ...models.map((m) => ({
      url: absUrl(`/p/${m.slug}`),
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.9,
      images: m.variants.flatMap((v) => v.images.slice(0, 1).map((i) => i.large)).slice(0, 20),
    })),
    { url: absUrl('/podbor'), lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: absUrl('/k'), lastModified, changeFrequency: 'weekly', priority: 0.6 },
    ...getGuides().map((g) => ({ url: absUrl(`/k/${g.slug}`), lastModified: g.updated, changeFrequency: 'weekly' as const, priority: 0.7 })),
    { url: absUrl('/otzyvy'), lastModified, changeFrequency: 'daily', priority: 0.6 },
    ...getPages().map((p) => ({ url: absUrl(`/${p.slug}`), changeFrequency: 'monthly' as const, priority: 0.3 })),
  ];
}
