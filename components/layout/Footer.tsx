import Link from 'next/link';
import { t } from '@/lib/i18n';
import { BUYER_PAGES, mainNav } from '@/lib/nav';
import { KASPI_SHOP_URL, contactLinks, siteContent } from '@/lib/site';

const linkClass = 'inline-flex min-h-[44px] items-center text-ink-2 hover:text-ink md:min-h-[30px]';
const headingClass = 'mb-1 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-ink-3';

export function Footer() {
  const nav = mainNav();
  const { contacts, legal } = siteContent;
  // WhatsApp и телефон - один номер: в подвале показываем WhatsApp, Instagram и почту.
  const links = contactLinks().filter((c) => c.kind !== 'phone');
  const contactLabel = { whatsapp: t('contacts.whatsapp'), instagram: t('contacts.instagram'), phone: t('contacts.phone'), email: t('contacts.email') };

  const groups = [
    { label: t('footer.catalog'), links: [...nav.categories, ...nav.extra] },
    { label: t('footer.buyers'), links: BUYER_PAGES.map((p) => ({ href: p.href, label: t(p.key) })) },
  ];

  return (
    <footer className="mt-12 bg-sand text-[0.9375rem] md:mt-16">
      <div className="container-page grid grid-cols-2 gap-x-4 gap-y-8 pb-8 pt-10 md:grid-cols-12 md:gap-x-8 md:pt-12">
        <div className="col-span-2 md:col-span-3">
          <Link href="/" className="inline-flex min-h-11 items-center font-display text-xl tracking-tight">
            {t('meta.siteName')}
          </Link>
          <p className="mt-1 max-w-xs text-ink-2">{t('footer.about')}</p>
        </div>

        {groups.map((g) => (
          <nav key={g.label} aria-label={g.label} className="md:col-span-3">
            <p className={headingClass}>{g.label}</p>
            <ul>
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="col-span-2 md:col-span-3">
          <p className={headingClass}>{t('footer.contacts')}</p>
          <ul>
            {links.map((c) => (
              <li key={c.href}>
                <a href={c.href} target={c.kind === 'email' ? undefined : '_blank'} rel="noopener" className={linkClass}>
                  <span className="sr-only">{contactLabel[c.kind]}: </span>
                  {c.kind === 'whatsapp' ? `${t('contacts.whatsapp')} ${c.label}` : c.label}
                </a>
              </li>
            ))}
            <li>
              <a href={KASPI_SHOP_URL} target="_blank" rel="noopener" className={`${linkClass} gap-1 font-semibold text-accent hover:text-accent`}>
                {t('footer.kaspiShop')}
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          </ul>
          {contacts.hours && (
            <p className="mt-2 text-sm text-ink-3">
              {t('footer.hoursLabel')}
              <br />
              {contacts.hours}
            </p>
          )}
        </div>
      </div>

      <div className="container-page">
        <div className="flex flex-col gap-1 border-t border-ink/10 py-5 text-[0.8125rem] text-ink-3 md:flex-row md:flex-wrap md:gap-x-6">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          {legal.entity && <p>{t('footer.legalLine', { entity: legal.entity, bin: legal.bin ?? '' })}</p>}
          {legal.address && <p>{t('footer.address', { address: legal.address })}</p>}
        </div>
      </div>
    </footer>
  );
}
