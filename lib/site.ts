import site from '@/content/ru/site.json';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://slingoemma.kz').replace(/\/$/, '');
export const KASPI_SHOP_URL = site.kaspiShopUrl;
export const BRAND = site.brand;
type Maybe = string | null;
type SiteContent = {
  alternateNames: string[];
  brandSince: number | null;
  contacts: { whatsapp: Maybe; instagram: Maybe; phone: Maybe; email: Maybe; hours: Maybe; city: Maybe };
  legal: { entity: Maybe; bin: Maybe; address: Maybe };
};
// Пока Эмма не прислала контакты, в JSON стоят null - тип задаём явно, чтобы код был готов к строкам.
export const siteContent: SiteContent = site;

export type ContactLink = { kind: 'whatsapp' | 'instagram' | 'phone' | 'email'; href: string; label: string };

/** Ссылки на контакты из content/ru/site.json; пустые поля пропускаются. */
export function contactLinks(): ContactLink[] {
  const c = siteContent.contacts;
  const links: Array<ContactLink | null> = [
    c.whatsapp ? { kind: 'whatsapp', href: `https://wa.me/${c.whatsapp.replace(/\D/g, '')}`, label: c.phone ?? c.whatsapp } : null,
    c.instagram ? { kind: 'instagram', href: `https://instagram.com/${c.instagram.replace(/^@/, '')}`, label: `@${c.instagram.replace(/^@/, '')}` } : null,
    c.phone ? { kind: 'phone', href: `tel:${c.phone.replace(/[^\d+]/g, '')}`, label: c.phone } : null,
    c.email ? { kind: 'email', href: `mailto:${c.email}`, label: c.email } : null,
  ];
  return links.filter((x): x is ContactLink => x !== null);
}

export function absUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
