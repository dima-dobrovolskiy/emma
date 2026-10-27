import { t } from '@/lib/i18n';
import { fmtRatingClient } from '@/lib/format';

type Props = { rating: number | null; count?: number; size?: 'sm' | 'md'; showValue?: boolean };

export function Stars({ rating, count, size = 'sm', showValue = true }: Props) {
  if (rating === null) return null;
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  const h = size === 'sm' ? 'h-4' : 'h-5';
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={`relative inline-block ${h} aspect-[5/1]`} role="img" aria-label={t('common.ratingOutOf', { rating: fmtRatingClient(rating) })}>
        <StarRow className="absolute inset-0 text-sand-2" />
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
          <StarRow className="text-star" />
        </span>
      </span>
      {showValue && <span className="font-semibold">{fmtRatingClient(rating)}</span>}
      {count !== undefined && <span className="text-ink-3">· {t('common.reviewsCount', { count })}</span>}
    </span>
  );
}

function StarRow({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 100 20" className={`h-full w-auto ${className}`} aria-hidden="true" fill="currentColor">
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          transform={`translate(${i * 20} 0)`}
          d="M10 1.5l2.6 5.5 6 .7-4.5 4.1 1.2 5.9L10 14.8l-5.3 2.9 1.2-5.9L1.4 7.7l6-.7z"
        />
      ))}
    </svg>
  );
}
