import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import { getPage, getPages } from '@/lib/pages';
import { getTrustNumbers } from '@/lib/catalog';
import { formatNumber, t } from '@/lib/i18n';
import { alternatesFor } from '@/lib/seo';
import { KASPI_SHOP_URL } from '@/lib/site';
import { fmtRating } from '@/lib/summary';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

type Params = { params: Promise<{ page: string }> };

export function generateStaticParams() {
  return getPages().map((p) => ({ page: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { page } = await params;
  const p = getPage(page);
  if (!p) return {};
  return { title: p.meta.title, description: p.meta.description, alternates: alternatesFor(`/${page}`) };
}

/** Цифры Kaspi для текстов страниц: {years} {orders} {reviews} {rating}. */
function Trust({ k }: { k: 'years' | 'orders' | 'reviews' | 'rating' }) {
  const tr = getTrustNumbers();
  const v = {
    years: tr.years !== null ? t('common.yearsCount', { count: tr.years }) : '-',
    orders: tr.ordersSegment !== null ? t('trust.orders', { value: formatNumber(tr.ordersSegment) }) : '-',
    reviews: formatNumber(tr.reviews),
    rating: tr.rating !== null ? fmtRating(tr.rating) : '-',
  }[k];
  return <>{v}</>;
}

export default async function StaticPage({ params }: Params) {
  const { page } = await params;
  const p = getPage(page);
  if (!p) notFound();
  const { content } = await compileMDX({
    source: p.body,
    components: {
      Trust,
      KaspiShop: ({ children }: { children: React.ReactNode }) => (
        <a href={KASPI_SHOP_URL} target="_blank" rel="noopener">
          {children}
        </a>
      ),
      Fraud: () => (
        <div className="not-prose my-6 rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <p className="font-semibold">{t('footer.fraudTitle')}</p>
          <p className="mt-1 text-ink-2">{t('footer.fraudText')}</p>
        </div>
      ),
    },
  });
  return (
    <div className="container-page pt-4">
      <Breadcrumbs items={[{ name: p.meta.h1, href: `/${page}` }]} />
      <h1 className="mt-4 text-[2rem] md:text-[2.75rem]">{p.meta.h1}</h1>
      <div className="prose-se mt-6">{content}</div>
    </div>
  );
}
