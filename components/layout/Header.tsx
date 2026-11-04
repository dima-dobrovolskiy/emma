import Link from 'next/link';
import { t } from '@/lib/i18n';
import { mainNav } from '@/lib/nav';
import { flags } from '@/lib/flags';
import { siteContent } from '@/lib/site';
import { LangSwitch } from './LangSwitch';
import { DesktopNav, MobileMenu } from './MobileMenu';

export function Header() {
  const nav = mainNav();
  return (
    <header className="sticky top-0 z-40 bg-bg/100 md:bg-bg/90 md:backdrop-blur-md">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded focus:bg-surface focus:px-3">
        {t('nav.skip')}
      </a>
      <div className="container-page flex h-14 items-center justify-between gap-4 md:h-16">
        <Link href="/" className="inline-flex min-h-11 flex-col justify-center text-ink">
          <span className="font-display text-[1.375rem] leading-none tracking-tight">{t('meta.siteName')}</span>
          {siteContent.tagline && <span className="mt-1 text-[0.75rem] leading-none text-ink-3">{siteContent.tagline}</span>}
        </Link>
        <DesktopNav links={[...nav.categories, ...nav.extra.filter((l) => l.href !== '/podbor')]} />
        <div className="flex items-center gap-2">
          {flags.kk && <LangSwitch />}
          <Link href="/podbor" className="btn btn-secondary hidden min-h-[44px] px-4 text-sm sm:inline-flex">
            {t('nav.podbor')}
          </Link>
          <MobileMenu links={[...nav.categories, ...nav.extra.filter((l) => l.href !== '/podbor')]} />
        </div>
      </div>
    </header>
  );
}
