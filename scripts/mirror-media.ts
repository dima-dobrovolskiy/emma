/*
 * Зеркалирование фото Kaspi в своё хранилище (OPEN-QUESTIONS Р2). По умолчанию выключено.
 *
 *   tsx scripts/mirror-media.ts [--scope=first|all] [--out=public/media]
 *
 * Скачивает gallery-large (1080 px) каждого фото, сжимает в WebP 180/370/750/1080 px,
 * кладёт в --out и пишет манифест data/media-manifest.json.
 * Включено по умолчанию (решение Р2, 2026-10-27): `pnpm build` сначала запускает этот скрипт с --soft.
 * Сайт берёт фото из манифеста, если файл реально лежит в public/media; выключить - MIRROR_MEDIA=0 (lib/images.ts).
 * --soft - ошибки скачивания не роняют сборку: такие фото остаются на CDN Kaspi.
 *
 * --scope=first - только первое фото каждой расцветки (это главное фото первого экрана: ~48 фото).
 * --scope=all   - все фото галерей (~600 фото, ~100+ МБ: в git не класть, нужно отдельное хранилище).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { productsFileSchema } from '../lib/kaspi/schema';

const ROOT = path.resolve(import.meta.dirname, '..');
const args = new Map(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=') as [string, string]));
const SCOPE = args.get('scope') === 'all' ? 'all' : 'first';
const OUT = path.resolve(ROOT, args.get('out') ?? 'public/media');
const MANIFEST = path.join(ROOT, 'data/media-manifest.json');
const SOFT = args.has('soft');
export const MEDIA_WIDTHS = [180, 370, 750, 1080] as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Ключ фото - путь на CDN Kaspi без параметра format. */
export function mediaKey(kaspiUrl: string): string {
  const u = new URL(kaspiUrl);
  return u.pathname;
}

async function download(url: string): Promise<Buffer> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000), headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (attempt === 2) throw e;
      await sleep(2000 * 2 ** attempt);
    }
  }
  throw new Error('unreachable');
}

async function main() {
  const products = productsFileSchema.parse(JSON.parse(readFileSync(path.join(ROOT, 'data/kaspi/products.json'), 'utf8')));
  const manifest: Record<string, { file: string; widths: number[] }> = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
  mkdirSync(OUT, { recursive: true });
  // Первое фото - с учётом порядка из content/catalog.json (imageOrder), как его покажет сайт.
  const catalog = JSON.parse(readFileSync(path.join(ROOT, 'content/catalog.json'), 'utf8')) as {
    models: Array<{ imageOrder: Record<string, number[]> }>;
  };
  const firstIndex = new Map<string, number>();
  for (const m of catalog.models) for (const [code, order] of Object.entries(m.imageOrder)) if (order[0] !== undefined) firstIndex.set(code, order[0]);
  const images = Object.values(products.items).flatMap((p) => {
    if (SCOPE === 'all') return p.images;
    const first = p.images[firstIndex.get(p.kaspiCode) ?? 0] ?? p.images[0];
    return first ? [first] : [];
  });
  // Обложка задаётся в content/catalog.json (imageOrder); рекламные слайды обложкой не бывают, отдельно их не фильтруем.
  let failed = 0;
  let done = 0;
  let bytesIn = 0;
  let bytesOut = 0;
  for (const img of images) {
    const key = mediaKey(img.large);
    const name = createHash('sha1').update(key).digest('hex').slice(0, 16);
    if (manifest[key] && MEDIA_WIDTHS.every((w) => existsSync(path.join(OUT, `${name}-${w}.webp`)))) continue;
    let src: Buffer;
    try {
      src = await download(img.large);
    } catch (e) {
      if (!SOFT) throw e;
      failed++;
      console.warn(`  не скачалось, остаётся на CDN Kaspi: ${img.large} (${String(e)})`);
      continue;
    }
    bytesIn += src.length;
    for (const w of MEDIA_WIDTHS) {
      const out = await sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: w <= 370 ? 72 : 68, effort: 5 }).toBuffer();
      writeFileSync(path.join(OUT, `${name}-${w}.webp`), out);
      if (w === 750) bytesOut += out.length;
    }
    manifest[key] = { file: name, widths: [...MEDIA_WIDTHS] };
    done++;
    if (done % 10 === 0) console.log(`  ${done} фото...`);
    await sleep(300);
  }
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);
  console.log(
    `Зеркало фото: новых ${done}, всего ${Object.keys(manifest).length}${failed ? `, не скачалось ${failed} (останутся на CDN Kaspi)` : ''}.` +
      (done ? ` Средний вес 750 px: было JPEG Kaspi 1080 px ${Math.round(bytesIn / done / 1024)} КБ, стало WebP 750 px ${Math.round(bytesOut / done / 1024)} КБ.` : ''),
  );
}

if (process.argv[1]?.endsWith('mirror-media.ts')) {
  main().catch((e: unknown) => {
    console.error(`Зеркалирование прервано: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(SOFT ? 0 : 1);
  });
}
