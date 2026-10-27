import { describe, expect, it } from 'vitest';
import { getCatalog } from '@/lib/catalog';
import { categorySummary, checkConsistency, ConsistencyError, modelSummary, renderTemplate } from '@/lib/summary';
import { getGuides } from '@/lib/guides';
import { guideModels, whatToBuy } from '@/lib/guide-data';
import { format, t } from '@/lib/i18n';
import { loadRedirects } from '@/lib/redirects';
import { checkTarget } from '../../scripts/gen-redirects';

const { models, categories } = getCatalog();

describe('сгенерированные тексты', () => {
  it('«Коротко» собирается для каждой модели и категории без противоречий', () => {
    for (const m of models) expect(modelSummary(m).length).toBeGreaterThan(20);
    for (const c of categories.filter((x) => x.models.length)) expect(categorySummary(c).length).toBeGreaterThan(20);
  });

  it('проверка ловит вес, которого нет в характеристиках (ошибка Larko «до 10 кг»)', () => {
    const classic = models.find((m) => m.slug === 'ergoryukzak-classic')!;
    expect(() => checkConsistency('Подходит для детей до 10 кг.', [classic])).toThrow(ConsistencyError);
    expect(() => checkConsistency('Максимальный вес - 22 кг.', [classic])).not.toThrow();
  });

  it('проверка ловит шаблонные хвосты и медицинские обещания', () => {
    const m = models[0]!;
    expect(() => checkConsistency('Мощность 1200 Вт', [m])).toThrow(ConsistencyError);
    expect(() => checkConsistency('Ортопедический рюкзак', [m])).toThrow(ConsistencyError);
    expect(() => checkConsistency('Цена 1 ₸', [m])).toThrow(ConsistencyError);
  });

  it('все плейсхолдеры в текстах моделей заполняются', () => {
    for (const m of models) {
      for (const x of [...m.whoFor, ...m.howToWear, ...m.care, ...m.faq.flatMap((f) => [f.q, f.a])]) {
        expect(renderTemplate(x, m)).not.toMatch(/\{\w+\}/);
      }
    }
  });

  it('«Что брать» в гайдах не повторяет модели', () => {
    for (const g of getGuides()) {
      const picks = whatToBuy(guideModels(g.models)).map((p) => p.model.slug);
      expect(new Set(picks).size, g.slug).toBe(picks.length);
    }
  });

  it('есть 3 гайда из ТЗ', () => {
    expect(getGuides().map((g) => g.slug).sort()).toEqual(['ergoryukzak-ili-sling', 'kak-vybrat-ergoryukzak', 's-kakogo-vozrasta-ergoryukzak']);
  });
});

describe('словарь', () => {
  it('русские плюралы', () => {
    expect(t('common.reviewsCount', { count: 1 })).toBe('1 отзыв');
    expect(t('common.reviewsCount', { count: 3 })).toBe('3 отзыва');
    expect(t('common.reviewsCount', { count: 11 })).toBe('11 отзывов');
    expect(t('common.reviewsCount', { count: 1104 })).toBe('1 104 отзыва');
    expect(format('{a} и {b}', { a: 1, b: 'x' })).toBe('1 и x');
  });
});

describe('редиректы', () => {
  it('36 строк, все цели существуют, включая ?color=', () => {
    const all = loadRedirects();
    expect(all).toHaveLength(36);
    for (const r of all) expect(checkTarget(r.to), `${r.from} → ${r.to}`).toBeNull();
  });
});
