import Link from 'next/link';
import { t } from '@/lib/i18n';
import { BUYER_PAGES, mainNav } from '@/lib/nav';
import { KASPI_SHOP_URL, contactLinks, siteContent } from '@/lib/site';

const linkClass = 'inline-flex min-h-[44px] items-center text-ink-2 hover:text-ink md:min-h-[32px]';

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
    <footer className="mt-16 bg-sand md:mt-24">
      <div className="container-page grid gap-7 pb-6 pt-10 md:grid-cols-2 md:gap-10 md:pb-8 md:pt-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="flex items-center justify-between gap-4 md:block">
            <Link href="/" className="inline-flex min-h-11 items-center font-display text-2xl tracking-tight">
              {t('meta.siteName')}
            </Link>
            <a href={KASPI_SHOP_URL} target="_blank" rel="noopener" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-accent md:mt-1 md:flex md:min-h-0 md:w-fit">
              {t('footer.kaspiShop')}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <p className="mt-1 max-w-sm text-[0.9375rem] text-ink-2 md:mt-3">{t('footer.about')}</p>
          {links.length > 0 ? (
            <>
              <ul className="mt-3 flex flex-wrap gap-x-5 text-[0.9375rem]">
                {links.map((c) => (
                  <li key={c.href}>
                    <a href={c.href} target={c.kind === 'email' ? undefined : '_blank'} rel="noopener" className={linkClass}>
                      <span className="sr-only">{contactLabel[c.kind]}: </span>
                      {c.kind === 'whatsapp' ? `${t('contacts.whatsapp')} ${c.label}` : c.label}
                    </a>
                  </li>
                ))}
              </ul>
              {contacts.hours && <p className="text-sm text-ink-3">{t('footer.hours', { hours: contacts.hours })}</p>}
            </>
          ) : (
            // Без контактов заглушку «появятся здесь» не показываем - только куда писать по заказу.
            <p className="mt-2 max-w-sm text-[0.9375rem] text-ink-2">{t('footer.orderQuestions')}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 md:gap-8 lg:col-span-5">
          {groups.map((g) => (
            <nav key={g.label} aria-label={g.label}>
              <p className="text-sm text-ink-3">{g.label}</p>
              <ul className="flex flex-wrap gap-x-5 text-[0.9375rem] sm:flex-col sm:gap-x-0">
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
        </div>

        <div className="text-[0.9375rem] md:col-span-2 md:max-w-xl lg:col-span-3 lg:max-w-none">
          <p className="font-semibold">{t('footer.fraudTitle')}</p>
          <p className="mt-1 text-ink-2">{t('footer.fraudText')}</p>
        </div>
      </div>

      <div className="container-page">
        <p className="border-t border-ink/10 py-5 text-[0.8125rem] text-ink-3">
          {t('footer.copyright', { year: new Date().getFullYear() })}
          {legal.entity && ` · ${t('footer.legalLine', { entity: legal.entity, bin: legal.bin ?? '' })}`}
          {legal.address && ` · ${t('footer.address', { address: legal.address })}`}
        </p>
      </div>
    </footer>
  );
}
