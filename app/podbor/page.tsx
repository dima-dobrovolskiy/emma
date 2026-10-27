import type { Metadata } from 'next';
import { getCatalog, getModel } from '@/lib/catalog';
import { alternatesFor } from '@/lib/seo';
import { t } from '@/lib/i18n';
import { cardSrcSet } from '@/lib/images';
import { creditText, maxWeightKg } from '@/lib/summary';
import type { PodborModel, Where } from '@/lib/podbor-rules';
import { Quiz } from '@/components/podbor/Quiz';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: { absolute: `${t('meta.podborTitle')}${t('meta.titleSuffix')}` },
  description: t('meta.podborDescription'),
  alternates: alternatesFor('/podbor'),
};

function ageRangeLabel(from: number | null, to: number | null): string {
  const f = from === null ? null : from === 0 ? t('podbor.fromBirth') : t('podbor.fromMonths', { count: from });
  const tt = to === null ? null : t('podbor.toMonths', { value: to % 12 === 0 ? t('common.yearsCount', { count: to / 12 }) : t('common.monthsCount', { count: to }) });
  return [f, tt].filter(Boolean).join(' ');
}

export default function PodborPage() {
  const { lines } = getCatalog();
  const toPodbor = (slug: string): PodborModel | null => {
    const m = getModel(slug);
    if (!m) return null;
    const rule = m.line ? lines.lines[m.line] : undefined;
    return {
      slug: m.slug,
      name: m.name,
      ageFrom: m.ageRange?.from ?? null,
      ageTo: m.ageRange?.to ?? null,
      weightFrom: m.weightRange?.from ?? null,
      weightTo: m.weightRange?.to ?? null,
      uses: (rule?.uses ?? []) as Where[],
      reviews: m.reviewsCount,
      rating: m.ratingAvg,
      minPrice: m.minPrice,
      // Подбор отбирает по осторожному весу из content/lines.json, а показывает тот же максимум, что и карточка.
      shownMaxKg: maxWeightKg(m),
      credit: creditText(m),
    };
  };
  const models = lines.podbor.carrierModels.map(toPodbor).filter((x): x is PodborModel => Boolean(x));
  const addons = lines.podbor.winterAddonModels.map(toPodbor).filter((x): x is PodborModel => Boolean(x));
  const images = Object.fromEntries(
    [...models, ...addons].map((m) => {
      const img = getModel(m.slug)?.defaultVariant.images[0];
      return [m.slug, img ? cardSrcSet(img).src : ''];
    }),
  );
  const ageRangeLabels = Object.fromEntries(models.map((m) => [m.slug, ageRangeLabel(m.ageFrom, m.ageTo)]));
  return (
    <div className="container-page max-w-3xl pt-4">
      <Breadcrumbs items={[{ name: t('nav.podbor'), href: '/podbor' }]} />
      <h1 className="h-page mt-4">{t('podbor.h1')}</h1>
      <p className="mt-2 text-lg text-ink-2">{t('podbor.lead')}</p>
      <div className="mt-8 rounded-[var(--radius-card)] bg-sand p-5 md:p-8">
        <Quiz
          ages={lines.podbor.ages}
          weights={lines.podbor.weights}
          where={lines.podbor.where}
          models={models}
          addons={addons}
          maxResults={lines.podbor.maxResults}
          ageLabels={Object.fromEntries(lines.podbor.ages.map((a) => [a.id, t(`age.${a.id}` as 'age.0-3')]))}
          ageRangeLabels={ageRangeLabels}
          images={images}
        />
      </div>
    </div>
  );
}
