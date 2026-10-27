/*
 * Генерирует 301-редиректы со старого сайта под оба хостинга:
 *   vercel.json (Vercel) и public/_redirects (Cloudflare Pages), плюс serve.json для локальной проверки.
 * Перед генерацией проверяет, что каждая цель существует: модель, категория, страница и расцветка ?color=.
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { getCatalog } from '../lib/catalog';
import { getGuides } from '../lib/guides';
import { getPages } from '../lib/pages';
import { activeRedirects, loadRedirects } from '../lib/redirects';

const ROOT = path.resolve(import.meta.dirname, '..');

export function validTargets() {
  const { models, categories, collections } = getCatalog();
  const paths = new Set<string>(['/', '/podbor', '/k', '/otzyvy']);
  for (const c of [...categories, ...collections]) paths.add(`/c/${c.slug}`);
  for (const g of getGuides()) paths.add(`/k/${g.slug}`);
  for (const p of getPages()) paths.add(`/${p.slug}`);
  const colors = new Map<string, Set<string>>();
  for (const m of models) {
    paths.add(`/p/${m.slug}`);
    colors.set(`/p/${m.slug}`, new Set(m.variants.map((v) => v.designSlug)));
  }
  return { paths, colors };
}

export function checkTarget(to: string, t = validTargets()): string | null {
  const [p, query] = to.split('?');
  if (!p || !t.paths.has(p)) return `нет страницы ${p}`;
  if (query) {
    const color = new URLSearchParams(query).get('color');
    if (!color) return `неожиданный query ${query}`;
    if (!t.colors.get(p)?.has(color)) return `у ${p} нет расцветки ${color}`;
  }
  return null;
}

function main() {
  const all = loadRedirects();
  const t = validTargets();
  const errors = all.map((r) => [r, checkTarget(r.to, t)] as const).filter(([, e]) => e);
  if (errors.length) {
    for (const [r, e] of errors) console.error(`  ${r.from} → ${r.to}: ${e}`);
    throw new Error(`Редиректы ведут на несуществующие цели: ${errors.length}`);
  }
  // Хостинги с cleanUrls сначала срезают .html: /page.html → /page. Дублируем правило для адреса без .html.
  const active = activeRedirects().flatMap((r) => (r.from.endsWith('.html') ? [r, { ...r, from: r.from.replace(/\.html$/, '') }] : [r]));
  const withSlash = active.flatMap((r) => (r.from.endsWith('.html') ? [r] : [r, { ...r, from: `${r.from}/` }]));

  writeFileSync(
    path.join(ROOT, 'vercel.json'),
    `${JSON.stringify(
      {
        $schema: 'https://openapi.vercel.sh/vercel.json',
        cleanUrls: true,
        trailingSlash: false,
        redirects: active.map((r) => ({ source: r.from, destination: r.to, permanent: true })),
        headers: [
          { source: '/_next/static/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
          { source: '/data/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }] },
        ],
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(
    path.join(ROOT, 'public/_redirects'),
    `# Сгенерировано scripts/gen-redirects.ts из data/redirects-tilda.csv. Руками не править.\n${withSlash.map((r) => `${r.from} ${r.to} 301`).join('\n')}\n`,
  );

  // Для локальной проверки: npx serve out -c ../serve.json
  writeFileSync(
    path.join(ROOT, 'serve.json'),
    `${JSON.stringify({ cleanUrls: true, trailingSlash: false, redirects: active.map((r) => ({ source: r.from, destination: r.to, type: 301 })) }, null, 2)}\n`,
  );

  console.log(`Редиректов: ${active.length} (+ варианты со слешем для Cloudflare), строк в CSV: ${all.length}. Записаны vercel.json, public/_redirects, serve.json`);
}

if (process.argv[1]?.endsWith('gen-redirects.ts')) main();
