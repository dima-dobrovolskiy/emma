import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { getCatalog } from '@/lib/catalog';

const seed = JSON.parse(readFileSync('data/catalog-seed.json', 'utf8')) as {
  variants: Array<{ kaspiCode: string; model: string; designSlug: string }>;
};
const catalog = JSON.parse(readFileSync('content/catalog.json', 'utf8')) as {
  models: Array<{ slug: string; line: string | null; variants: Array<{ kaspiCode: string; designSlug: string }> }>;
};

// Маркеры линейки в реальном имени модели Kaspi (promoConditions / product.name из отзывов).
const LINE_MARKERS: Record<string, RegExp> = {
  classic: /classic|4\+|4 ?мес/i,
  tiddly: /tiddly|2\+|2 ?мес|зайчата/i,
  beborn: /beborn|0\+|рожден/i,
  nesty: /nesty|3\+/i,
};

describe('маппинг SKU → модель → расцветка', () => {
  it('все 48 SKU из seed есть в маппинге, ровно по одному разу', () => {
    const codes = catalog.models.flatMap((m) => m.variants.map((v) => v.kaspiCode));
    expect(codes).toHaveLength(48);
    expect(new Set(codes).size).toBe(48);
    expect(new Set(codes)).toEqual(new Set(seed.variants.map((v) => v.kaspiCode)));
  });

  it('13 моделей, у каждой модели уникальные designSlug', () => {
    expect(catalog.models).toHaveLength(13);
    for (const m of catalog.models) {
      const slugs = m.variants.map((v) => v.designSlug);
      expect(new Set(slugs).size, m.slug).toBe(slugs.length);
    }
  });

  it('маппинг совпадает с seed (модель и расцветка)', () => {
    const bySeed = new Map(seed.variants.map((v) => [v.kaspiCode, v]));
    for (const m of catalog.models) {
      for (const v of m.variants) {
        expect(bySeed.get(v.kaspiCode)?.model, v.kaspiCode).toBe(m.slug);
        expect(bySeed.get(v.kaspiCode)?.designSlug, v.kaspiCode).toBe(v.designSlug);
      }
    }
  });

  it('реальное имя модели Kaspi соответствует линейке', () => {
    const { models } = getCatalog();
    for (const m of models) {
      if (!m.line || !LINE_MARKERS[m.line]) continue;
      for (const v of m.variants) {
        if (!v.kaspiModelName) continue;
        expect(v.kaspiModelName, `${m.slug} ${v.kaspiCode}`).toMatch(LINE_MARKERS[m.line]!);
      }
    }
  });

  it('модели не пустые, у каждой расцветки есть цена и ссылка на Kaspi', () => {
    for (const m of getCatalog().models) {
      expect(m.variants.length, m.slug).toBeGreaterThan(0);
      for (const v of m.variants) {
        expect(v.price, v.kaspiCode).toBeGreaterThan(0);
        expect(v.kaspiUrl, v.kaspiCode).toMatch(/^https:\/\/kaspi\.kz\/shop\/p\//);
        expect(v.kaspiUrl, v.kaspiCode).toContain(v.kaspiCode);
      }
    }
  });

  it('unmapped.json пуст или каждый SKU записан в OPEN-QUESTIONS', () => {
    const { unmapped } = getCatalog();
    const questions = readFileSync('OPEN-QUESTIONS.md', 'utf8');
    for (const u of unmapped) expect(questions).toContain(`нужен маппинг: ${u.kaspiCode}`);
  });
});
