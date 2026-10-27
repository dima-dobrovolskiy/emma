import site from '@/content/ru/site.json';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://slingoemma.kz').replace(/\/$/, '');
export const KASPI_SHOP_URL = site.kaspiShopUrl;
export const BRAND = site.brand;
type Maybe = string | null;
type SiteContent = {
  alternateNames: string[];
  contacts: { whatsapp: Maybe; instagram: Maybe; phone: Maybe; email: Maybe; hours: Maybe; city: Maybe };
  legal: { entity: Maybe; bin: Maybe; address: Maybe };
};
// Пока Эмма не прислала контакты, в JSON стоят null - тип задаём явно, чтобы код был готов к строкам.
export const siteContent: SiteContent = site;

export function absUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
