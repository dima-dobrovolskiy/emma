'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/*
 * Общий слой движения сайта. Без JS и при prefers-reduced-motion всё работает как обычно, просто без анимации.
 * - <details> раскрываются и закрываются плавно (FAQ, фильтры и любые новые).
 * - Полоска загрузки сверху, пока открывается другая страница.
 * - Страница заранее подгружается, когда на ссылку навели курсор, коснулись пальцем или перешли с клавиатуры.
 */

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useDetailsMotion() {
  useEffect(() => {
    const running = new WeakMap<HTMLDetailsElement, { anim: Animation; opening: boolean }>();

    const finish = (details: HTMLDetailsElement) => {
      details.style.overflow = '';
      running.delete(details);
    };

    const onClick = (e: MouseEvent) => {
      const summary = (e.target as Element | null)?.closest?.('summary');
      const details = summary?.parentElement;
      if (!summary || !(details instanceof HTMLDetailsElement) || details.querySelector(':scope > summary') !== summary) return;
      if (reducedMotion()) return;
      e.preventDefault();

      const prev = running.get(details);
      const from = details.getBoundingClientRect().height;
      prev?.anim.cancel();
      const opening = prev ? !prev.opening : !details.open;

      details.style.overflow = 'hidden';
      details.open = false;
      const closed = details.getBoundingClientRect().height;
      details.open = true;
      const to = opening ? details.getBoundingClientRect().height : closed;

      const duration = Math.min(380, Math.max(220, Math.abs(to - from) * 0.5 + 140));
      const anim = details.animate({ height: [`${from}px`, `${to}px`] }, { duration, easing: EASE });
      running.set(details, { anim, opening });
      if (opening) {
        for (const el of details.children) {
          if (el !== summary) el.animate({ opacity: [0, 1], transform: ['translateY(-6px)', 'none'] }, { duration: duration + 60, easing: EASE });
        }
      }
      anim.onfinish = () => {
        if (!opening) details.open = false;
        finish(details);
      };
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
}

function useIntentPrefetch() {
  const router = useRouter();
  useEffect(() => {
    const done = new Set<string>();
    const prefetch = (target: EventTarget | null) => {
      const a = (target as Element | null)?.closest?.('a[href]');
      if (!(a instanceof HTMLAnchorElement) || (a.target && a.target !== '_self')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname || done.has(url.pathname)) return;
      done.add(url.pathname);
      router.prefetch(url.pathname);
    };
    const onOver = (e: PointerEvent) => e.pointerType === 'mouse' && prefetch(e.target);
    const onFocus = (e: FocusEvent) => prefetch(e.target);
    // На телефоне касание при прокрутке - не намерение: ждём 80 мс и отменяем, если палец поехал.
    let timer = 0;
    const onTouchStart = (e: TouchEvent) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => prefetch(e.target), 80);
    };
    const onTouchMove = () => window.clearTimeout(timer);
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('focusin', onFocus);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
    };
  }, [router]);
}

/** Полоска загрузки: стартует по клику на внутреннюю ссылку, заканчивается, когда сменился адрес. */
function NavProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [seen, setSeen] = useState(pathname);
  if (seen !== pathname) {
    setSeen(pathname);
    if (state === 'loading') setState('done');
  }

  useEffect(() => {
    // Фаза перехвата: обработчик Link отменяет событие раньше, чем оно дойдёт до document.
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]');
      if (!(a instanceof HTMLAnchorElement) || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      setState('loading');
    };
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    if (state !== 'done') return;
    const id = window.setTimeout(() => setState('idle'), 450);
    return () => window.clearTimeout(id);
  }, [state]);

  return <div aria-hidden="true" className="nav-progress" data-state={state} />;
}

export function Motion() {
  useDetailsMotion();
  useIntentPrefetch();
  return <NavProgress />;
}

/** Новая страница проявляется мягко. Первая загрузка - без анимации, чтобы не задерживать первый экран. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reducedMotion()) return;
    // Только прозрачность и не с нуля: transform на обёртке сломал бы position: fixed у липкой панели покупки,
    // а проявление с полной прозрачности ощущается как моргание.
    ref.current?.animate({ opacity: [0.55, 1] }, { duration: 220, easing: EASE });
  }, [pathname]);
  return <div ref={ref}>{children}</div>;
}
