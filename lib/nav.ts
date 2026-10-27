import { getCatalog } from './catalog';
import { t } from './i18n';

export const BUYER_PAGES = [
  { href: '/kak-kupit', key: 'pages.kakKupit' },
  { href: '/dostavka', key: 'pages.dostavka' },
  { href: '/garantiya', key: 'pages.garantiya' },
  { href: '/o-brende', key: 'pages.oBrende' },
  { href: '/kontakty', key: 'pages.kontakty' },
  { href: '/konfidentsialnost', key: 'pages.konfidentsialnost' },
] as const;

export function mainNav() {
  const { categories } = getCatalog();
  return {
    categories: categories.filter((c) => c.models.length > 0).map((c) => ({ href: `/c/${c.slug}`, label: c.nameShort })),
    extra: [
      { href: '/podbor', label: t('nav.podbor') },
      { href: '/k', label: t('nav.guides') },
      { href: '/otzyvy', label: t('nav.reviews') },
    ],
  };
}
