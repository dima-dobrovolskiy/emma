'use client';

import { useRef, useState } from 'react';
import { usePageLoaded } from '@/lib/hooks';
import type { KaspiImage } from '@/lib/kaspi/schema';
import { gallerySrcSet, thumbSrc } from '@/lib/images';
import { t } from '@/lib/i18n';

/** Галерея на scroll-snap: свайп на мобильном, миниатюры на десктопе. Без внешних библиотек. */
export function Gallery({ images, alt, badge }: { images: KaspiImage[]; alt: string; badge: string | null }) {
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
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setIndex(i);
    setLoadedUpTo((x) => Math.max(x, i + 1));
  };

  if (!images.length) return <div className="aspect-[3/4] rounded-[var(--radius-card)] bg-sand" />;

  return (
    <div className="md:sticky md:top-20 md:self-start">
      <div className="relative -mx-4 md:mx-0">
        <div
          ref={track}
          onScroll={onScroll}
          className="no-scrollbar flex aspect-[3/4] snap-x snap-mandatory overflow-x-auto bg-sand md:rounded-[var(--radius-card)]"
          aria-label={t('model.gallery', { name: alt })}
          role="region"
          tabIndex={0}
        >
          {images.map((img, i) => (
            <div
              key={img.medium}
              className="relative h-full w-full shrink-0 snap-center"
              role="group"
              aria-roledescription="slide"
              aria-label={t('model.photoOf', { index: i + 1, total: images.length })}
            >
              {i === 0 && (
                <img
                  {...gallerySrcSet(img)}
                  sizes="(min-width: 1200px) 600px, (min-width: 768px) 52vw, 100vw"
                  alt={alt}
                  width={750}
                  height={1000}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              )}
              {i > 0 && i <= loadedUpTo && <img
                {...gallerySrcSet(img)}
                sizes="(min-width: 1200px) 600px, (min-width: 768px) 52vw, 100vw"
                alt={`${alt} - ${t('model.photoOf', { index: i + 1, total: images.length })}`}
                width={750}
                height={1000}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />}
            </div>
          ))}
        </div>
        {badge && index === 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-surface/95 px-3 py-1.5 text-sm font-semibold shadow">{badge}</span>
        )}
        {images.length > 1 && (
          <>
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-semibold text-bg">
              {index + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label={t('model.prevPhoto')}
              className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 shadow disabled:opacity-0 md:flex"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              disabled={index === images.length - 1}
              aria-label={t('model.nextPhoto')}
              className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 shadow disabled:opacity-0 md:flex"
            >
              ›
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar mt-3 hidden gap-2 overflow-x-auto md:flex">
          {images.map((img, i) => (
            <button
              key={img.medium}
              type="button"
              onClick={() => go(i)}
              aria-label={t('model.photoOf', { index: i + 1, total: images.length })}
              aria-current={i === index}
              className={`h-[72px] w-[54px] shrink-0 overflow-hidden rounded-lg border-2 ${i === index ? 'border-ink' : 'border-transparent'}`}
            >
              <img src={thumbSrc(img)} alt="" width={54} height={72} loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
