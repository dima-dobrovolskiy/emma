import site from '@/content/ru/site.json';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://slingoemma.kz').replace(/\/$/, '');
export const KASPI_SHOP_URL = site.kaspiShopUrl;
export const BRAND = site.brand;
export const siteContent = site;

export function absUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
