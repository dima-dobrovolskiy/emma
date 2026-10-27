import { describe, expect, it } from 'vitest';
import { matchAge, matchWeight, podbor, type PodborModel } from '@/lib/podbor-rules';
import { getCatalog, getModel } from '@/lib/catalog';

const { lines } = getCatalog();
const ages = lines.podbor.ages;
const weights = lines.podbor.weights;

function toPodbor(slug: string): PodborModel {
  const m = getModel(slug)!;
  return {
    slug,
    name: m.name,
    ageFrom: m.ageRange?.from ?? null,
    ageTo: m.ageRange?.to ?? null,
    weightFrom: m.weightRange?.from ?? null,
    weightTo: m.weightRange?.to ?? null,
    uses: (m.line ? lines.lines[m.line]?.uses : []) as PodborModel['uses'],
    reviews: m.reviewsCount,
    rating: m.ratingAvg,
    minPrice: m.minPrice,
  };
}
const carriers = lines.podbor.carrierModels.map(toPodbor);
const addons = lines.podbor.winterAddonModels.map(toPodbor);

describe('правила подбора', () => {
  it('никогда не предлагает модель с максимальным весом ниже веса ребёнка', () => {
    for (const age of ages)
      for (const weight of weights)
        for (const where of lines.podbor.where) {
          const r = podbor(carriers, addons, { age, weight, where });
          for (const m of r.main) expect(m.weightTo, `${m.slug} для ${weight.id}`).toBeGreaterThanOrEqual(weight.toKg);
          for (const m of r.winterAddon) if (m.weightTo !== null) expect(m.weightTo).toBeGreaterThanOrEqual(weight.toKg);
          expect(r.main.length).toBeLessThanOrEqual(lines.podbor.maxResults);
        }
  });

  it('для 18-22 кг предлагает только Classic (до 22 кг)', () => {
    const r = podbor(carriers, addons, { age: ages.find((a) => a.id === '12-24')!, weight: weights.find((w) => w.id === '18-22')!, where: 'walks' });
    expect(r.main.map((m) => m.slug)).toEqual(['ergoryukzak-classic']);
  });

  it('для новорождённого (0-3 мес, до 7 кг) предлагает BeBorn и не предлагает Classic', () => {
    const r = podbor(carriers, addons, { age: ages[0]!, weight: weights[0]!, where: 'home' });
    const slugs = r.main.map((m) => m.slug);
    expect(slugs).toContain('ergoryukzak-beborn');
    expect(slugs).not.toContain('ergoryukzak-classic');
  });

  it('при «зимой» добавляет накидку, иначе нет', () => {
    const base = { age: ages.find((a) => a.id === '6-12')!, weight: weights.find((w) => w.id === '7-14')! };
    expect(podbor(carriers, addons, { ...base, where: 'winter' }).winterAddon.length).toBe(1);
    expect(podbor(carriers, addons, { ...base, where: 'walks' }).winterAddon.length).toBe(0);
  });

  it('matchWeight без данных о максимальном весе - false', () => {
    expect(matchWeight({ ageFrom: 0, ageTo: null, weightFrom: null, weightTo: null }, weights[0]!)).toBe(false);
  });

  it('matchAge: модель с 4 мес подходит для 3-6, но не для 0-3', () => {
    const m = { ageFrom: 4, ageTo: 24, weightFrom: 7, weightTo: 22 };
    expect(matchAge(m, ages.find((a) => a.id === '3-6')!)).toBe(true);
    expect(matchAge(m, ages.find((a) => a.id === '0-3')!)).toBe(false);
  });
});
