'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { t } from '@/lib/i18n';

/** Переключатель языка. Показывается только при FEATURE_KK (решает Header). */
export function LangSwitch() {
  const path = usePathname() || '/';
  const isKk = path === '/kk' || path.startsWith('/kk/');
  const ru = isKk ? path.replace(/^\/kk/, '') || '/' : path;
  const kk = isKk ? path : path === '/' ? '/kk' : `/kk${path}`;
  return (
    <nav aria-label={t('lang.switch')} className="flex items-center rounded-full border border-line bg-surface p-0.5 text-sm">
      <Link href={ru} hrefLang="ru" aria-current={!isKk ? 'true' : undefined} className={`flex h-10 items-center rounded-full px-3 ${!isKk ? 'bg-ink text-bg' : ''}`}>
        {t('lang.ru')}
      </Link>
      <Link href={kk} hrefLang="kk" aria-current={isKk ? 'true' : undefined} className={`flex h-10 items-center rounded-full px-3 ${isKk ? 'bg-ink text-bg' : ''}`}>
        {t('lang.kk')}
      </Link>
    </nav>
  );
}
