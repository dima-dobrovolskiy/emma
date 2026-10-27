import Link from 'next/link';
import { t } from '@/lib/i18n';
import { mainNav } from '@/lib/nav';

export function Header() {
  const nav = mainNav();
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        {t('nav.skip')}
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-display text-[1.45rem] font-semibold tracking-tight text-ink">
          {t('meta.siteName')}
        </Link>
        <nav aria-label={t('nav.mainNav')} className="hidden lg:block">
          <ul className="flex items-center gap-1 text-[0.95rem]">
            {[...nav.categories, ...nav.extra].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-[44px] items-center rounded-full px-3 text-ink-2 hover:bg-sand hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/podbor" className="btn btn-primary hidden min-h-[44px] px-4 text-sm sm:inline-flex lg:hidden xl:inline-flex">
            {t('nav.podbor')}
          </Link>
          <details className="group relative lg:hidden">
            <summary
              className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-line bg-surface [&::-webkit-details-marker]:hidden"
              aria-label={t('nav.menu')}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="group-open:hidden">
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="hidden group-open:block">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </summary>
            <nav
              aria-label={t('nav.mainNav')}
              className="absolute right-0 top-[calc(100%+0.5rem)] w-[min(20rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-line bg-surface p-2 shadow-[var(--shadow-card)]"
            >
              <ul>
                {[...nav.categories, ...nav.extra].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="flex min-h-[48px] items-center rounded-xl px-4 hover:bg-sand">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
