import { getCatalog, getModel } from '@/lib/catalog';
import { allReviewsDTO, modelReviewsDTO } from '@/lib/reviews-data';

// Статические JSON с отзывами для «Показать ещё» и фильтров: /data/reviews/{model}.json и /data/reviews/all.json
export const dynamic = 'force-static';

export function generateStaticParams() {
  return [...getCatalog().models.filter((m) => m.ratingCount > 0).map((m) => ({ file: `${m.slug}.json` })), { file: 'all.json' }];
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const slug = file.replace(/\.json$/, '');
  if (slug === 'all') return Response.json(allReviewsDTO());
  const model = getModel(slug);
  return Response.json(model ? modelReviewsDTO(model) : []);
}
