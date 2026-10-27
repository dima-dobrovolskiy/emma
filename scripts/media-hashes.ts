/*
 * Отпечатки фото Kaspi (dHash 64 бита) - чтобы скрывать на сайте рекламные слайды из галерей Kaspi
 * («ждём ваш отзыв», переписки, слайды с врачами, сравнения с другими брендами) во всех расцветках сразу.
 * Kaspi хранит один и тот же слайд отдельным файлом у каждой расцветки, поэтому сравниваем картинки, а не адреса.
 *
 *   tsx scripts/media-hashes.ts            - досчитать отпечатки новых фото
 *   tsx scripts/media-hashes.ts --soft     - ошибки скачивания не роняют прогон
 *
 * Пишет data/media-hashes.json { путь фото на CDN: hex }. Какие отпечатки скрывать - content/media-rules.json.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { productsFileSchema } from '../lib/kaspi/schema';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'data/media-hashes.json');
const SOFT = process.argv.includes('--soft');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function dHash(buf: Buffer): Promise<string> {
  const px = await sharp(buf).grayscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  let bits = 0n;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      bits = (bits << 1n) | (px[y * 9 + x]! > px[y * 9 + x + 1]! ? 1n : 0n);
    }
  }
  return bits.toString(16).padStart(16, '0');
}

async function download(url: string): Promise<Buffer> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000), headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (attempt === 2) throw e;
      await sleep(1500 * 2 ** attempt);
    }
  }
  throw new Error('unreachable');
}

async function main() {
  const products = productsFileSchema.parse(JSON.parse(readFileSync(path.join(ROOT, 'data/kaspi/products.json'), 'utf8')));
  const hashes: Record<string, string> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
  let added = 0;
  let failed = 0;
  for (const item of Object.values(products.items)) {
    for (const img of item.images) {
      const key = new URL(img.large).pathname;
      if (hashes[key]) continue;
      try {
        hashes[key] = await dHash(await download(img.small));
        added++;
      } catch (e) {
        if (!SOFT) throw e;
        failed++;
        console.warn(`  не скачалось: ${img.small} (${String(e)})`);
      }
      await sleep(150);
    }
  }
  const sorted = Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(OUT, `${JSON.stringify(sorted, null, 1)}\n`);
  console.log(`Отпечатки фото: новых ${added}, всего ${Object.keys(sorted).length}${failed ? `, не скачалось ${failed}` : ''}.`);
}

if (process.argv[1]?.endsWith('media-hashes.ts')) {
  main().catch((e: unknown) => {
    console.error(`Отпечатки фото: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(SOFT ? 0 : 1);
  });
}
