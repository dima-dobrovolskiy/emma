'use client';

import Link from 'next/link';
import { track } from '@/lib/analytics/events';

export function GuideModelLink({ guide, model, className, children }: { guide: string; model: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={`/p/${model}`} prefetch={false} className={className} onClick={() => track('guide_to_product', { guide, model })}>
      {children}
    </Link>
  );
}
