import Link from 'next/link';
import { t } from '@/lib/i18n';
import { BUYER_PAGES, mainNav } from '@/lib/nav';
import { KASPI_SHOP_URL, siteContent } from '@/lib/site';

const linkClass = 'inline-flex min-h-[44px] items-center text-ink-2 hover:text-ink md:min-h-[32px]';

export function Footer() {
  const nav = mainNav();
  const { contacts, legal } = siteContent;
  // TODO(Эмма): контакты и юр. данные - content/ru/site.json (OPEN-QUESTIONS Э6)
  const contactLinks = [
    contacts.whatsapp && { href: `https://wa.me/${contacts.whatsapp.replace(/\D/g, '')}`, label: t('footer.whatsapp') },
    contacts.instagram && { href: `https://instagram.com/${contacts.instagram.replace(/^@/, '')}`, label: t('footer.instagram') },
    contacts.phone && { href: `tel:${contacts.phone.replace(/[^\d+]/g, '')}`, label: contacts.phone },
  ].filter((x): x is { href: string; label: string } => Boolean(x));

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
          {contactLinks.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-x-5 text-sm">
              {contactLinks.map((c) => (
                <li key={c.href}>
                  <a href={c.href} target={c.href.startsWith('tel:') ? undefined : '_blank'} rel="noopener" className={linkClass}>
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            // TODO(Эмма): пока контактов нет, заглушку «появятся здесь» не показываем - только куда писать по заказу.
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
          {/* TODO(Эмма): юр. данные (ИП/ТОО, БИН) - content/ru/site.json, OPEN-QUESTIONS Э6. До этого строку не показываем. */}
          {legal.entity && ` · ${t('footer.legalLine', { entity: legal.entity, bin: legal.bin ?? '' })}`}
        </p>
      </div>
    </footer>
  );
}
