'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { t } from '@/lib/i18n';

type NavLink = { href: string; label: string };

/** Меню на десктопе: текущий раздел отмечен. */
export function DesktopNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label={t('nav.mainNav')} className="hidden lg:block">
      <ul className="flex items-center gap-1 text-[0.95rem]">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={pathname === l.href || pathname.startsWith(`${l.href}/`) ? 'page' : undefined}
              className="inline-flex min-h-[44px] items-center px-2.5 text-[0.9375rem] text-ink-2 underline decoration-transparent decoration-2 underline-offset-[7px] hover:text-ink hover:decoration-line-strong aria-[current=page]:text-ink aria-[current=page]:decoration-ink"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Меню на мобильном: закрывается по нажатию на пункт, при смене страницы, по Esc и по тапу мимо. */
export function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setOpen(false);
  }
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
    };
    const root = document.documentElement;
    root.classList.add('scroll-locked');
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      root.classList.remove('scroll-locked');
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? t('nav.closeMenu') : t('nav.menu')}
        onClick={() => setOpen((x) => !x)}
        className="press relative -mr-2 flex h-11 w-11 items-center justify-center rounded-full"
      >
        <span aria-hidden="true" className="burger" data-open={open}>
          <span />
          <span />
          <span />
        </span>
      </button>
      <div aria-hidden="true" className="menu-backdrop absolute inset-x-0 top-full h-[100dvh] bg-ink/20" data-open={open} />
      <div
        ref={panel}
        id={id}
        inert={!open}
        data-open={open}
        className="menu-panel absolute inset-x-0 top-full max-h-[calc(100dvh-3.5rem)] overflow-y-auto bg-surface shadow-[var(--shadow-pop)]"
      >
        <nav aria-label={t('nav.mainNav')} className="container-page py-3">
          <ul className="divide-y divide-line/70">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === l.href ? 'page' : undefined}
                  className="flex min-h-[52px] items-center justify-between text-[1.0625rem] text-ink aria-[current=page]:font-semibold"
                >
                  {l.label}
                  <span aria-hidden="true" className="text-ink-3">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/podbor" onClick={() => setOpen(false)} className="btn btn-primary press mt-4 mb-2 w-full">
            {t('home.ctaPodbor')}
          </Link>
        </nav>
      </div>
    </div>
  );
}
