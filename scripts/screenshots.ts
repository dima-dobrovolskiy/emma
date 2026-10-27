/*
 * Скриншоты ключевых страниц на 360, 390, 768 и 1280 px.
 *   pnpm build && npx serve out -l 4173 & ; tsx scripts/screenshots.ts [--base=http://localhost:4173] [--only=/,/p/ergoryukzak-classic]
 * Результат: reports/screenshots/{width}/{page}.png
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const args = new Map(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=') as [string, string]));
const BASE = args.get('base') ?? 'http://localhost:4173';
const WIDTHS = (args.get('widths') ?? '360,390,768,1280').split(',').map(Number);
const PAGES = (args.get('only') ?? '/,/c/ergoryukzaki,/p/ergoryukzak-classic,/p/ergoryukzak-tiddly,/podbor,/k/kak-vybrat-ergoryukzak').split(',');
const FULL = args.get('full') !== 'false';
const OUT = path.resolve(import.meta.dirname, '../reports/screenshots');

// Локально без скачивания браузеров Playwright можно взять установленный Chrome: PW_CHANNEL=chrome
const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
const problems: string[] = [];
for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 800 : 900 }, deviceScaleFactor: 1, isMobile: width < 768, hasTouch: width < 768 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`${width} ${page.url()}: JS error ${e.message}`));
  page.on('response', (r) => {
    if (r.status() >= 400) problems.push(`${width} ${page.url()}: HTTP ${r.status()} ${r.url().slice(0, 160)}`);
  });
  page.on('requestfailed', (r) => {
    // Отменённые префетчи Next.js при уходе со страницы - не ошибка.
    if (r.failure()?.errorText !== 'net::ERR_ABORTED') problems.push(`${width} ${page.url()}: не загрузилось ${r.url().slice(0, 160)} (${r.failure()?.errorText})`);
  });
  for (const p of PAGES) {
    await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle' });
    // Прокручиваем страницу, чтобы сработала ленивая загрузка картинок.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState('networkidle');
    // Горизонтальный скролл = поломка вёрстки.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) problems.push(`${width} ${p}: горизонтальный скролл ${overflow}px`);
    const dir = path.join(OUT, String(width));
    mkdirSync(dir, { recursive: true });
    const name = p === '/' ? 'home' : p.replace(/^\//, '').replace(/[/?=&]/g, '_');
    await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: FULL });
    // Нарезка длинной страницы на куски по 1200 px - удобно просматривать глазами.
    if (args.has('slices')) {
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0, i = 1; y < height; y += 1200, i++) {
        await page.screenshot({ path: path.join(dir, `${name}--${i}.png`), fullPage: true, clip: { x: 0, y, width, height: Math.min(1200, height - y) } });
      }
    }
  }
  await ctx.close();
}
await browser.close();
console.log(problems.length ? `Проблемы:\n${problems.join('\n')}` : 'Проблем не найдено');
process.exit(problems.length ? 1 : 0);
