import { t } from '@/lib/i18n';

/** Блок «Коротко» - один абзац с ценой, оценкой, отзывами и ключевыми параметрами. */
export function Short({ text, date }: { text: string; date?: string }) {
  if (!text) return null;
  return (
    <section aria-label={t('common.short')} className="rounded-[var(--radius-card)] bg-sand p-5 md:p-6">
      <p className="eyebrow mb-2">{t('common.short')}</p>
      <p className="text-[1.0625rem] leading-relaxed text-ink">{text}</p>
      {date && <p className="mt-3 text-sm text-ink-3">{date}</p>}
    </section>
  );
}
