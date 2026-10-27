'use client';

import { t } from '@/lib/i18n';

/*
 * Заготовка окна «заберите бонус продавца» (FEATURE_BONUS_POPUP, по умолчанию выключено).
 * TODO(Дима): куда отправлять номер (CRM / Kaspi-трекер) и текст согласия - решить до включения флага.
 * Сейчас форма ничего никуда не отправляет.
 */
export function BonusPopup({ onClose }: { onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="bonus-title" className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 md:items-center">
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-surface p-6 shadow-xl">
        <h2 id="bonus-title" className="text-xl">
          {t('bonus.title')}
        </h2>
        <p className="mt-2 text-ink-2">{t('bonus.text')}</p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          <label className="block text-sm font-semibold" htmlFor="bonus-phone">
            {t('bonus.phone')}
          </label>
          <input id="bonus-phone" type="tel" inputMode="tel" autoComplete="tel" className="h-12 w-full rounded-xl border border-line px-4" />
          <button type="submit" className="btn btn-primary w-full">
            {t('bonus.submit')}
          </button>
          <button type="button" onClick={onClose} className="btn btn-secondary w-full">
            {t('bonus.decline')}
          </button>
          <p className="text-xs text-ink-3">{t('bonus.consent')}</p>
        </form>
      </div>
    </div>
  );
}
