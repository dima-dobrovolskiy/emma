import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import cities from '@/content/ru/cities.json';
import { getCatalog, getCategory } from '@/lib/catalog';
import { flags } from '@/lib/flags';
import { t } from '@/lib/i18n';
import { alternatesFor } from '@/lib/seo';
import { absUrl } from '@/lib/site';
import { ModelCard } from '@/components/product/ModelCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { JsonLd } from '@/components/ui/JsonLd';

/*
 * Шаблон городской страницы категории: /c/{category}/{city}. За флагом FEATURE_CITY_PAGES.
 * TODO(Дима): включить после запуска; цифры заказов по городу - из Kaspi Merchant API (OPEN-QUESTIONS Д4).
 * Пока флаг выключен, собирается одна служебная страница с noindex (статическому экспорту нужен хотя бы один путь),
 * она не попадает в sitemap и на неё нет ссылок.
 */

type Params = { params: Promise<{ category: string; city: string }> };

export function generateStaticParams() {
  if (!flags.cityPages) return [{ category: 'ergoryukzaki', city: 'almaty' }];
  const { categories } = getCatalog();
  return categories.filter((c) => c.models.length).flatMap((c) => cities.cities.map((city) => ({ category: c.slug, city: city.slug })));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category, city } = await params;
  const c = getCategory(category);
  const ct = cities.cities.find((x) => x.slug === city);
  if (!c || !ct) return {};
  return {
    title: t('city.h1', { category: c.name, city: ct.in }),
    description: t('city.lead', { city: ct.in }),
    alternates: alternatesFor(`/c/${category}/${city}`),
    robots: flags.cityPages ? undefined : { index: false, follow: false },
  };
}

export default async function CityPage({ params }: Params) {
  const { category, city } = await params;
  const c = getCategory(category);
  const ct = cities.cities.find((x) => x.slug === city);
  if (!c || !ct) notFound();
  return (
    <div className="container-page pt-4">
      <Breadcrumbs items={[{ name: c.nameShort, href: `/c/${c.slug}` }, { name: ct.name, href: `/c/${c.slug}/${ct.slug}` }]} />
      <h1 className="mt-4 text-[2rem] md:text-[2.75rem]">{t('city.h1', { category: c.name, city: ct.in })}</h1>
      <p className="mt-2 text-ink-2">{t('city.lead', { city: ct.in })}</p>
      <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {c.models.map((m) => (
          <li key={m.slug}>
            <ModelCard model={m} />
          </li>
        ))}
      </ul>
      {flags.cityPages && (
      <nav aria-label={t('city.otherCities')} className="mt-10">
        <p className="eyebrow mb-3">{t('city.otherCities')}</p>
        <ul className="flex flex-wrap gap-2">
          {cities.cities
            .filter((x) => x.slug !== ct.slug)
            .map((x) => (
              <li key={x.slug}>
                <Link href={`/c/${c.slug}/${x.slug}`} className="chip">
                  {x.name}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
      )}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: t('city.h1', { category: c.name, city: ct.in }),
          itemListElement: c.models.map((m, i) => ({ '@type': 'ListItem', position: i + 1, url: absUrl(`/p/${m.slug}`), name: m.name })),
        }}
      />
    </div>
  );
}
