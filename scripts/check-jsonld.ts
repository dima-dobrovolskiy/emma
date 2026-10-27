/*
 * Проверка JSON-LD во всей статической сборке:
 * - каждый блок - валидный JSON с @context schema.org и @type;
 * - обязательные поля для расширенных результатов Google: Product, AggregateOffer, AggregateRating, Review,
 *   BreadcrumbList, FAQPage, ItemList, Organization, WebSite;
 * - на ключевых страницах есть нужные типы.
 */
import { htmlFiles, read, urlPathOf } from './lib-out';

type Node = Record<string, unknown>;
const errors: string[] = [];
const typesByPage = new Map<string, Set<string>>();

function req(page: string, node: Node, type: string, fields: string[]) {
  for (const f of fields) {
    const v = node[f];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) errors.push(`${page}: ${type} без поля ${f}`);
  }
}

function num(page: string, v: unknown, what: string, min?: number, max?: number) {
  if (typeof v !== 'number' || Number.isNaN(v)) return errors.push(`${page}: ${what} не число (${String(v)})`);
  if ((min !== undefined && v < min) || (max !== undefined && v > max)) errors.push(`${page}: ${what} вне диапазона: ${v}`);
}

function check(page: string, node: Node) {
  const type = String(node['@type']);
  typesByPage.get(page)!.add(type);
  switch (type) {
    case 'Product': {
      req(page, node, type, ['name', 'image', 'description', 'offers', 'brand']);
      const o = node.offers as Node;
      req(page, o, 'AggregateOffer', ['lowPrice', 'highPrice', 'priceCurrency', 'offerCount', 'availability']);
      num(page, o.lowPrice, 'lowPrice', 1);
      num(page, o.highPrice, 'highPrice', 1);
      if ((o.lowPrice as number) > (o.highPrice as number)) errors.push(`${page}: lowPrice > highPrice`);
      if (node.aggregateRating) {
        const r = node.aggregateRating as Node;
        num(page, r.ratingValue, 'ratingValue', 1, 5);
        num(page, r.ratingCount, 'ratingCount', 1);
        num(page, r.reviewCount, 'reviewCount', 0);
        if ((r.reviewCount as number) > (r.ratingCount as number)) errors.push(`${page}: reviewCount > ratingCount`);
        const reviews = (node.review as Node[]) ?? [];
        if (reviews.length > 5) errors.push(`${page}: больше 5 Review в разметке`);
        for (const rv of reviews) {
          req(page, rv, 'Review', ['author', 'reviewRating', 'reviewBody', 'datePublished']);
          num(page, (rv.reviewRating as Node).ratingValue, 'Review.ratingValue', 1, 5);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(String(rv.datePublished))) errors.push(`${page}: Review.datePublished не ISO`);
        }
      }
      break;
    }
    case 'BreadcrumbList': {
      const items = (node.itemListElement as Node[]) ?? [];
      if (!items.length) errors.push(`${page}: пустой BreadcrumbList`);
      items.forEach((it, i) => {
        req(page, it, 'ListItem', ['position', 'name', 'item']);
        if (it.position !== i + 1) errors.push(`${page}: BreadcrumbList position ${String(it.position)} вместо ${i + 1}`);
      });
      break;
    }
    case 'FAQPage': {
      const qs = (node.mainEntity as Node[]) ?? [];
      if (!qs.length) errors.push(`${page}: пустой FAQPage`);
      for (const q of qs) {
        req(page, q, 'Question', ['name', 'acceptedAnswer']);
        req(page, q.acceptedAnswer as Node, 'Answer', ['text']);
        if (/\{\w+\}/.test(JSON.stringify(q))) errors.push(`${page}: незаполненный плейсхолдер в FAQ: ${String(q.name)}`);
      }
      break;
    }
    case 'ItemList': {
      const items = (node.itemListElement as Node[]) ?? [];
      if (!items.length) errors.push(`${page}: пустой ItemList`);
      for (const it of items) req(page, it, 'ListItem', ['position', 'url']);
      break;
    }
    case 'Organization':
      req(page, node, type, ['name', 'url']);
      break;
    case 'WebSite':
      req(page, node, type, ['name', 'url']);
      break;
    default:
      errors.push(`${page}: неожиданный тип ${type}`);
  }
}

let blocks = 0;
for (const file of htmlFiles()) {
  const page = urlPathOf(file);
  typesByPage.set(page, new Set());
  const html = read(file);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    blocks++;
    let data: unknown;
    try {
      data = JSON.parse(m[1]!);
    } catch (e) {
      errors.push(`${page}: невалидный JSON-LD (${String(e)})`);
      continue;
    }
    for (const node of (Array.isArray(data) ? data : [data]) as Node[]) {
      if (node['@context'] !== 'https://schema.org') errors.push(`${page}: @context не https://schema.org`);
      check(page, node);
    }
  }
}

const expect: Record<string, string[]> = {
  '/': ['Organization', 'WebSite', 'FAQPage'],
  '/c/ergoryukzaki': ['BreadcrumbList', 'ItemList', 'FAQPage'],
  '/p/ergoryukzak-classic': ['BreadcrumbList', 'Product', 'FAQPage'],
  '/p/ergoryukzak-tiddly': ['BreadcrumbList', 'Product', 'FAQPage'],
  '/k/kak-vybrat-ergoryukzak': ['BreadcrumbList', 'ItemList', 'FAQPage'],
};
for (const [page, types] of Object.entries(expect)) {
  const got = typesByPage.get(page);
  if (!got) errors.push(`${page}: страница не найдена в сборке`);
  else for (const tp of types) if (!got.has(tp)) errors.push(`${page}: нет ${tp}`);
}

console.log(`JSON-LD: страниц ${typesByPage.size}, блоков ${blocks}, ошибок ${errors.length}`);
for (const e of errors.slice(0, 50)) console.log(`  ${e}`);
process.exit(errors.length ? 1 : 0);
