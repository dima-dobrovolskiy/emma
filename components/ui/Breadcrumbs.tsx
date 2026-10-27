import Link from 'next/link';
import { t } from '@/lib/i18n';
import { absUrl } from '@/lib/site';
import { JsonLd } from './JsonLd';

export type Crumb = { name: string; href: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ name: t('nav.home'), href: '/' }, ...items];
  return (
    <>
      <nav aria-label={t('nav.breadcrumbs')} className="text-sm text-ink-3">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {all.map((c, i) => (
            <li key={c.href} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i < all.length - 1 ? (
                <Link href={c.href} className="inline-flex min-h-[44px] items-center hover:text-ink">
                  {c.name}
                </Link>
              ) : (
                <span aria-current="page" className="text-ink-2">
                  {c.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: all.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: absUrl(c.href) })),
        }}
      />
    </>
  );
}
