/* Проверка внутренних ссылок в статической сборке: каждая ссылка /... должна вести на существующий файл в out/. */
import { existsInOut, htmlFiles, read, urlPathOf } from './lib-out';

const broken: string[] = [];
let checked = 0;
for (const file of htmlFiles()) {
  const html = read(file);
  for (const m of html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
    const url = m[1]!.replace(/&amp;/g, '&');
    if (url.startsWith('//') || url.startsWith('/_next/')) continue;
    checked++;
    if (!existsInOut(url)) broken.push(`${urlPathOf(file)} → ${url}`);
  }
}
const uniq = [...new Set(broken)];
console.log(`Проверено внутренних ссылок: ${checked}, битых: ${uniq.length}`);
for (const b of uniq.slice(0, 50)) console.log(`  ${b}`);
process.exit(uniq.length ? 1 : 0);
