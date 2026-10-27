'use client';

import { useEffect, useRef, useState } from 'react';
import { usePageLoaded } from '@/lib/hooks';
import { t } from '@/lib/i18n';

/** Облегчённый плеер: превью-картинка, iframe YouTube грузится только по клику. */
export function LiteYouTube({ id, title }: { id: string; title: string }) {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  // Превью видео - после загрузки страницы: оно ниже первого экрана и не должно отнимать канал у главного фото.
  const thumb = usePageLoaded();
  // Кнопка заменяется плеером: переносим фокус в плеер, иначе он теряется.
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (on) frame.current?.focus();
  }, [on]);
  return (
    <div className="relative aspect-video overflow-hidden rounded-[var(--radius-card)] bg-ink">
      {on && (
        <iframe
          ref={frame}
          onLoad={() => setReady(true)}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {!ready && (
        <button
          type="button"
          onClick={() => setOn(true)}
          disabled={on}
          className={`group absolute inset-0 h-full w-full ${on ? 'pointer-events-none' : ''}`}
          aria-label={t('common.playVideo', { title })}
        >
          {thumb && <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" width={480} height={360} className="h-full w-full object-cover opacity-90 transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.02] group-hover:opacity-100" />}
          <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-ink transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95">
            {on ? (
              <span className="spinner" aria-hidden="true" />
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </span>
        </button>
      )}
    </div>
  );
}
