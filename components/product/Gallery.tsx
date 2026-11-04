'use client';

import { useRef, useState } from 'react';
import { usePageLoaded } from '@/lib/hooks';
import type { GalleryImage } from '@/lib/media-types';
import { t } from '@/lib/i18n';

/**
 * Галерея на scroll-snap: свайп и точки на мобильном, миниатюры на десктопе. Без внешних библиотек.
 * Фото целиком (3:4) в светлой рамке с полями - не во всю ширину экрана (правка Эммы 2026-11-05).
 */
export function Gallery({
  images,
  alt,
  badge,
  pill,
  swapped = false,
}: {
  images: GalleryImage[];
  alt: string;
  badge: string | null;
  /** Плашка рассрочки в углу рамки */
  pill?: React.ReactNode;
  swapped?: boolean;
}) {
  const [index, setIndex] = useState(0);
  // Фото грузим по мере листания: текущее и соседнее. Остальные 10-20 фото по 200+ КБ не тянем заранее.
  const [scrolledTo, setLoadedUpTo] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  // Соседнее фото подгружаем, когда страница загрузилась, чтобы не делить канал с первым.
  const pageLoaded = usePageLoaded();
  const loadedUpTo = Math.max(scrolledTo, pageLoaded ? 1 : 0);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(images.length - 1, i));
    setLoadedUpTo((x) => Math.max(x, next + 1));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: next * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  };

  const thumbs = useRef<HTMLDivElement>(null);
  // Лента миниатюр (только на десктопе) подтягивается к активному фото. Прокручиваем только саму ленту:
  // scrollIntoView на скрытой ленте в Safari на телефоне дёргал страницу и срывал свайп галереи.
  const followThumb = (i: number) => {
    const strip = thumbs.current;
    const thumb = strip?.children[i] as HTMLElement | undefined;
    if (!strip || !thumb || strip.offsetParent === null) return;
    const left = thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2;
    strip.scrollTo({ left, behavior: 'smooth' });
  };
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) followThumb(i);
    setIndex(i);
    setLoadedUpTo((x) => Math.max(x, i + 1));
  };

  if (!images.length) return <div className="aspect-[6/7] rounded-[var(--radius-card)] bg-sand md:aspect-square" />;

  return (
    <div className={`md:sticky md:top-20 md:self-start ${swapped ? 'swap-in' : ''}`}>
      <div className="relative">
        <div
          ref={track}
          onScroll={onScroll}
          className="no-scrollbar flex aspect-[6/7] snap-x snap-mandatory overflow-x-auto rounded-[var(--radius-card)] bg-sand md:aspect-square"
          aria-label={t('model.gallery', { name: alt })}
          role="region"
          tabIndex={0}
        >
          {images.map((img, i) => (
            <div
              key={img.src}
              className="relative flex h-full w-full shrink-0 snap-center items-center justify-center px-3 pb-3 pt-12 md:px-5 md:pb-5 md:pt-14"
              role="group"
              aria-roledescription={t('model.slide')}
              aria-label={t('model.photoOf', { index: i + 1, total: images.length })}
              aria-hidden={i > loadedUpTo ? true : undefined}
            >
              {i === 0 && (
                <img
                  src={img.src}
                  srcSet={img.srcSet}
                  sizes={SIZES}
                  alt={alt}
                  width={750}
                  height={1000}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className={IMG}
                />
              )}
              {i > 0 && i <= loadedUpTo && <img
                src={img.src}
                  srcSet={img.srcSet}
                sizes={SIZES}
                alt={`${alt} - ${t('model.photoOf', { index: i + 1, total: images.length })}`}
                width={750}
                height={1000}
                loading="lazy"
                decoding="async"
                className={IMG}
              />}
            </div>
          ))}
        </div>
        {pill && <div className="pointer-events-none absolute left-2.5 top-2.5 md:left-3 md:top-3">{pill}</div>}
        {badge && index === 0 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-surface px-3 py-1.5 text-sm font-semibold">{badge}</span>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label={t('model.prevPhoto')}
              className="press absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface transition-opacity disabled:opacity-0 md:flex"
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              disabled={index === images.length - 1}
              aria-label={t('model.nextPhoto')}
              className="press absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface transition-opacity disabled:opacity-0 md:flex"
            >
              <Chevron dir="right" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        // Точки - только подсказка, сколько фото и где мы: листают свайпом. Для чтения с экрана есть подписи слайдов.
        <div aria-hidden="true" className="mt-3 flex flex-wrap justify-center gap-1.5 md:hidden">
          {images.map((img, i) => (
            <span key={img.src} className={`h-1.5 rounded-full transition-[width,background-color] duration-200 ${i === index ? 'w-4 bg-ink' : 'w-1.5 bg-line-strong/50'}`} />
          ))}
        </div>
      )}
      {images.length > 1 && (
        <div ref={thumbs} className="no-scrollbar mt-2 hidden gap-2 overflow-x-auto p-1 md:flex">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => go(i)}
              aria-label={t('model.photoOf', { index: i + 1, total: images.length })}
              aria-current={i === index}
              className={`press h-[72px] w-[54px] shrink-0 overflow-hidden rounded-lg border-2 transition-[border-color,transform,opacity] duration-200 ${i === index ? 'border-ink' : 'border-transparent opacity-80 hover:opacity-100'}`}
            >
              <img src={img.thumb} alt="" width={54} height={72} loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Фото 3:4 по высоте рамки, по бокам светлые поля; сверху место под плашку рассрочки, чтобы она не закрывала фото.
const IMG = 'h-full w-auto max-w-full rounded-[0.25rem] object-contain';
const SIZES = '(min-width: 1200px) 440px, (min-width: 768px) 36vw, 72vw';

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" className={dir === 'left' ? 'rotate-180' : undefined}>
      <path d="M7.5 4.5L13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
