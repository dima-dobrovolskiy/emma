import { describe, expect, it } from 'vitest';
import { decodeEntities, extractBackendComponent, modelNameFromBaseCodes, parseKaspiDate, parseListingItem, parseReview } from '@/lib/kaspi/parse';
import { parseAgeRange, parseWeightKg } from '@/lib/text';

describe('разбор ответов Kaspi', () => {
  it('достаёт BACKEND.components.item из HTML, не ломаясь на скобках в строках', () => {
    const html = '<script>BACKEND.components.item = {"card":{"title":"a } b { c","n":1}};</script>';
    expect(extractBackendComponent(html, 'item')).toEqual({ card: { title: 'a } b { c', n: 1 } });
  });

  it('имя модели из baseProductCodes', () => {
    expect(modelNameFromBaseCodes(['[Master - Ergobaby carriers and soft carriers][slingoemma]{эргорюкзак}{18}{Слинг 2+ Tiddly Черный}'])).toBe('Слинг 2+ Tiddly Черный');
    expect(modelNameFromBaseCodes(['[Master - Swaddling blankets][slingoemma]{436593951}', '24363431b'])).toBeNull();
  });

  it('листинг: SKU из configSku для групп вариантов, рассрочка строкой, бонус', () => {
    const item = parseListingItem({
      id: '24363431b',
      configSku: '179623125',
      title: 'Комплект',
      shopLink: '/p/komplekt-24363431b/?c=750000000',
      unitPrice: 27990,
      unitSalePrice: 27990,
      priceMinusBonus: 27151,
      creditMonthlyPrice: 2333,
      monthlyInstallment: { id: 12, formattedPerMonth: '2 333 ₸' },
      stock: 1,
    });
    expect(item.kaspiCode).toBe('179623125');
    expect(item.creditMonthlyPrice).toBe('2 333 ₸');
    expect(item.creditMonths).toBe(12);
    expect(item.bonus).toBe(839);
    expect(item.inStock).toBe(true);
    expect(item.url).toBe('https://kaspi.kz/shop/p/komplekt-24363431b/');
  });

  it('отзыв: без номера заказа, имя автора как на Kaspi, дата ISO', () => {
    const r = parseReview(
      { id: 'abc', author: 'Инара', date: '13.08.2024', rating: 5, comment: { text: ' текст &#43; ', plus: '', minus: '' }, feedback: { positive: 10 }, galleryImages: [] },
      '106533064',
    );
    expect(r).not.toHaveProperty('orderNumber');
    expect(r.author).toBe('Инара');
    expect(r.date).toBe('2024-08-13');
    expect(r.text).toBe('текст +');
    expect(r.id).toMatch(/^[0-9a-f]{16}$/);
    expect(parseKaspiDate('01.02.2025')).toBe('2025-02-01');
  });

  it('декодирует HTML-сущности Kaspi', () => {
    expect(decodeEntities('0&#43; &#x1f31e; &quot;Шёлк&quot;')).toBe('0+ 🌞 "Шёлк"');
  });

  it('возраст и вес из характеристик', () => {
    expect(parseAgeRange('с 3мес до 2 лет')).toEqual({ from: 3, to: 24 });
    expect(parseAgeRange('с 4-5 мес до 2 лет')).toEqual({ from: 4, to: 24 });
    expect(parseAgeRange('до 2 лет')).toEqual({ from: null, to: 24 });
    expect(parseAgeRange('От рождения до 1,6 лет')).toEqual({ from: 0, to: 19 });
    expect(parseAgeRange('3+')).toEqual({ from: 3, to: null });
    expect(parseWeightKg('18 кг')).toBe(18);
    expect(parseWeightKg('0.5 кг')).toBe(0.5);
  });
});
