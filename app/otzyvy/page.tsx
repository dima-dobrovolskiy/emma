import type { Metadata } from 'next';
import { getCatalog, getTrustNumbers, hasReviewBody } from '@/lib/catalog';
import { formatNumber, t } from '@/lib/i18n';
import { alternatesFor, socialMeta } from '@/lib/seo';
import { fmtRating } from '@/lib/summary';
import { allDistribution, allReviewsDTO } from '@/lib/reviews-data';
import { ReviewsBlock } from '@/components/reviews/ReviewsBlock';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export function generateMetadata(): Metadata {
  const tr = getTrustNumbers();
  const title = t('meta.reviewsTitle', { count: formatNumber(tr.reviews) });
  const description = t('meta.reviewsDescription', { count: formatNumber(tr.reviews), rating: tr.rating !== null ? fmtRating(tr.rating) : '-' });
  return {
    // В заголовке уже «SlingoEmma» - без хвоста с брендом.
    title: { absolute: title },
    description,
    alternates: alternatesFor('/otzyvy'),
    ...socialMeta({ title, description, path: '/otzyvy' }),
  };
}

export default function ReviewsPage() {
  const tr = getTrustNumbers();
  const all = allReviewsDTO();
  const models = getCatalog().models.filter((m) => m.reviewsCount > 0);
  return (
    <div className="container-page pt-4">
      <Breadcrumbs items={[{ name: t('pages.otzyvy'), href: '/otzyvy' }]} />
      <h1 className="mb-6 mt-4 h-page">{t('reviews.title')}</h1>
      <ReviewsBlock
        initial={all.slice(0, 12)}
        totalWithText={tr.reviews}
        totalListed={all.filter(hasReviewBody).length}
        ratingCount={tr.ratingCount}
        ratingAvg={tr.rating}
        distribution={allDistribution()}
        dataUrl="/data/reviews/all.json"
        groupBy="model"
        groupOptions={models.map((m) => ({ value: m.slug, label: m.name }))}
        pageSize={12}
        analyticsPage="reviews"
      />
    </div>
  );
}
