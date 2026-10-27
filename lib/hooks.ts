'use client';

import { useSyncExternalStore } from 'react';

/*
 * Внешние источники состояния браузера: параметры адреса и факт загрузки страницы.
 * На сервере (статическая сборка) возвращают значения по умолчанию, в браузере - реальные.
 */

const URL_EVENT = 'se:urlchange';

// Next.js меняет адрес через history.pushState/replaceState, а это не вызывает popstate.
// Оповещаем подписчиков сами, асинхронно: Next зовёт pushState внутри своих эффектов, где обновлять состояние нельзя.
declare global {
  interface Window {
    __seHistoryPatched?: boolean;
  }
}
if (typeof window !== 'undefined' && !window.__seHistoryPatched) {
  window.__seHistoryPatched = true;
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = window.history[method].bind(window.history);
    window.history[method] = (...args: Parameters<History['pushState']>) => {
      original(...args);
      queueMicrotask(() => window.dispatchEvent(new Event(URL_EVENT)));
    };
  }
}

function subscribeUrl(cb: () => void) {
  window.addEventListener('popstate', cb);
  window.addEventListener(URL_EVENT, cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener(URL_EVENT, cb);
  };
}

/** Строка query текущего адреса. На сервере - пустая. */
export function useSearch(): string {
  return useSyncExternalStore(
    subscribeUrl,
    () => window.location.search,
    () => '',
  );
}

export function useUrlParam(name: string): string | null {
  return new URLSearchParams(useSearch()).get(name);
}

/** Меняет параметры адреса без перезагрузки и без новой записи в истории. */
export function setUrlParams(params: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
    else url.searchParams.delete(k);
  }
  window.history.replaceState(window.history.state, '', url.toString());
}

function subscribeLoad(cb: () => void) {
  window.addEventListener('load', cb);
  return () => window.removeEventListener('load', cb);
}

/** true после события load: всё, что было в HTML (включая главное фото), загрузилось. */
export function usePageLoaded(): boolean {
  return useSyncExternalStore(
    subscribeLoad,
    () => document.readyState === 'complete',
    () => false,
  );
}
