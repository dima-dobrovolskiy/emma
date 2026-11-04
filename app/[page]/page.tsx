import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import { getPage, getPages } from '@/lib/pages';
import { getTrustNumbers } from '@/lib/catalog';
import { formatNumber, t } from '@/lib/i18n';
import { alternatesFor, socialMeta } from '@/lib/seo';
import { KASPI_SHOP_URL, contactLinks, siteContent } from '@/lib/site';
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
  return {
    title: p.meta.title,
    description: p.meta.description,
    alternates: alternatesFor(`/${page}`),
    ...socialMeta({ title: `${p.meta.title}${t('meta.titleSuffix')}`, description: p.meta.description, path: `/${page}` }),
  };
}

/** Цифры для текстов страниц: лет на рынке (со слов Эммы) и цифры Kaspi. */
function Trust({ k }: { k: 'marketYears' | 'years' | 'orders' | 'reviews' | 'rating' | 'shopRating' }) {
  const tr = getTrustNumbers();
  const v = {
    marketYears: tr.marketYears !== null ? t('common.yearsCount', { count: tr.marketYears }) : '-',
    shopRating: tr.merchantRating !== null ? fmtRating(tr.merchantRating) : '-',
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
      Contacts: () => <ContactsList />,
      Legal: () => <LegalData />,
    },
  });
  return (
    <div className="container-page pt-4">
      <Breadcrumbs items={[{ name: p.meta.h1, href: `/${page}` }]} />
      <h1 className="h-page mt-4">{p.meta.h1}</h1>
      <div className="prose-se mt-6">{content}</div>
    </div>
  );
}

/** Контакты из content/ru/site.json - тот же источник, что у подвала и разметки Organization. */
function ContactsList() {
  const { contacts } = siteContent;
  const label = { whatsapp: t('contacts.whatsapp'), instagram: t('contacts.instagram'), phone: t('contacts.phone'), email: t('contacts.email') };
  const rows = [
    ...contactLinks().map((c) => ({
      key: c.kind,
      name: label[c.kind],
      value: (
        <a href={c.href} target={c.kind === 'phone' || c.kind === 'email' ? undefined : '_blank'} rel="noopener" className="font-semibold text-accent underline underline-offset-4">
          {c.label}
        </a>
      ),
    })),
    ...(contacts.hours ? [{ key: 'hours', name: t('contacts.hours'), value: <>{contacts.hours}</> }] : []),
  ];
  if (!rows.length) return null;
  return (
    <dl className="not-prose my-6 max-w-[44rem] divide-y divide-line border-y border-line">
      {rows.map((r) => (
        <div key={r.key} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4 py-3">
          <dt className="text-ink-3">{r.name}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Юридические данные продавца из content/ru/site.json. */
function LegalData() {
  const { legal } = siteContent;
  const rows = [
    legal.entity ? { key: 'entity', name: t('contacts.legalEntity'), value: legal.entity } : null,
    legal.bin ? { key: 'bin', name: t('contacts.bin'), value: legal.bin } : null,
    legal.address ? { key: 'address', name: t('contacts.address'), value: legal.address } : null,
  ].filter((x): x is { key: string; name: string; value: string } => x !== null);
  if (!rows.length) return null;
  return (
    <dl className="not-prose my-6 max-w-[44rem] divide-y divide-line border-y border-line">
      {rows.map((r) => (
        <div key={r.key} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4 py-3">
          <dt className="text-ink-3">{r.name}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

