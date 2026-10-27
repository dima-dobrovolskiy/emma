import Link from 'next/link';
import { t } from '@/lib/i18n';
import { BUYER_PAGES, mainNav } from '@/lib/nav';
import { KASPI_SHOP_URL, siteContent } from '@/lib/site';

export function Footer() {
  const nav = mainNav();
  const { contacts, legal } = siteContent;
  const hasContacts = Boolean(contacts.whatsapp || contacts.instagram || contacts.phone);
  // TODO(Эмма): контакты и юр. данные - content/ru/site.json (OPEN-QUESTIONS Э6)
  return (
    <footer className="mt-16 border-t border-line bg-sand/60">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-xl font-semibold">{t('meta.siteName')}</p>
          <p className="mt-3 text-sm text-ink-2">{t('footer.about')}</p>
          <a href={KASPI_SHOP_URL} target="_blank" rel="noopener" className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-accent underline underline-offset-4">
            {t('footer.kaspiShop')}
          </a>
        </div>
        <nav aria-label={t('footer.catalog')}>
          <p className="eyebrow mb-3">{t('footer.catalog')}</p>
          <ul className="space-y-0.5 text-sm">
            {[...nav.categories, ...nav.extra].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-[44px] items-center text-ink-2 hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t('footer.buyers')}>
          <p className="eyebrow mb-3">{t('footer.buyers')}</p>
          <ul className="space-y-0.5 text-sm">
            {BUYER_PAGES.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="inline-flex min-h-[44px] items-center text-ink-2 hover:text-ink">
                  {t(p.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-5">
          <div>
            <p className="eyebrow mb-3">{t('footer.contacts')}</p>
            <p className="text-sm text-ink-2">{hasContacts ? null : t('footer.contactsPending')}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-sm font-semibold">{t('footer.fraudTitle')}</p>
            <p className="mt-1 text-sm text-ink-2">{t('footer.fraudText')}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-ink-3 md:flex-row md:justify-between">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <p>{legal.entity ? t('footer.legalLine', { entity: legal.entity, bin: legal.bin ?? '' }) : t('footer.legalPending')}</p>
        </div>
      </div>
    </footer>
  );
}
