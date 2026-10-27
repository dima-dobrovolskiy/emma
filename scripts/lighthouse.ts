/*
 * Lighthouse mobile по ключевым страницам. Нужен запущенный сервер со сборкой (npx serve out -l 4173).
 *   tsx scripts/lighthouse.ts [--base=http://localhost:4173] [--only=/,/p/ergoryukzak-classic]
 * Порог из ТЗ: 90+ по всем категориям, LCP < 2,5 с, CLS < 0,1.
 */
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = new Map(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=') as [string, string]));
const BASE = args.get('base') ?? 'http://localhost:4173';
const PAGES = (args.get('only') ?? '/,/c/ergoryukzaki,/p/ergoryukzak-classic,/p/ergoryukzak-tiddly,/k/kak-vybrat-ergoryukzak').split(',');
// --throttling=devtools - реальное замедление сети и CPU вместо расчётной модели (simulate по умолчанию).
const THROTTLING = args.get('throttling') === 'devtools' ? 'devtools' : 'simulate';
const OUT = path.resolve(import.meta.dirname, '../reports/lighthouse', THROTTLING);
mkdirSync(OUT, { recursive: true });

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
let failed = false;
const rows: string[] = [];
try {
  for (const p of PAGES) {
    const res = await lighthouse(`${BASE}${p}`, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      throttlingMethod: THROTTLING,
    });
    if (!res) throw new Error(`Lighthouse не вернул результат для ${p}`);
    const lhr = res.lhr;
    const score = (k: string) => Math.round((lhr.categories[k]?.score ?? 0) * 100);
    const lcp = (lhr.audits['largest-contentful-paint']?.numericValue ?? 0) / 1000;
    const cls = lhr.audits['cumulative-layout-shift']?.numericValue ?? 0;
    const s = { perf: score('performance'), a11y: score('accessibility'), bp: score('best-practices'), seo: score('seo') };
    const ok = Object.values(s).every((x) => x >= 90) && lcp < 2.5 && cls < 0.1;
    if (!ok) failed = true;
    rows.push(`${ok ? 'OK ' : 'НЕТ'} ${p.padEnd(32)} perf ${s.perf} · a11y ${s.a11y} · bp ${s.bp} · seo ${s.seo} · LCP ${lcp.toFixed(2)} с · CLS ${cls.toFixed(3)}`);
    const name = p === '/' ? 'home' : p.slice(1).replace(/\//g, '_');
    writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(lhr));
    // Непройденные аудиты - чтобы сразу видеть, что чинить.
    for (const [cat, c] of Object.entries(lhr.categories)) {
      for (const ref of c.auditRefs) {
        const a = lhr.audits[ref.id];
        if (a && a.score !== null && a.score < 0.9 && ref.weight > 0) rows.push(`      [${cat}] ${a.id}: ${a.title}${a.displayValue ? ` (${a.displayValue})` : ''}`);
      }
    }
  }
} finally {
  await chrome.kill();
}
console.log(`Lighthouse mobile, троттлинг: ${THROTTLING}\n${rows.join('\n')}`);
process.exit(failed ? 1 : 0);
