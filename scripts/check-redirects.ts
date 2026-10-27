/*
 * Проверка всех старых адресов из data/redirects-tilda.csv по HTTP:
 * каждый отдаёт 301 на нужную цель, а цель отвечает 200.
 *   tsx scripts/check-redirects.ts --base=http://localhost:4174   (локально: npx serve out -l 4174 -c ../serve.json)
 *   tsx scripts/check-redirects.ts --base=https://slingoemma.kz    (после запуска)
 */
import { loadRedirects } from '../lib/redirects';

const args = new Map(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=') as [string, string]));
const BASE = (args.get('base') ?? 'http://localhost:4174').replace(/\/$/, '');

const errors: string[] = [];
const warnings: string[] = [];
let ok = 0;

/** Идём по цепочке редиректов (до 3 шагов) и возвращаем коды и конечный путь. */
async function follow(from: string) {
  const codes: number[] = [];
  let url = `${BASE}${from}`;
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { redirect: 'manual' });
    codes.push(res.status);
    const loc = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && loc) {
      url = new URL(loc, url).toString();
      continue;
    }
    const u = new URL(url);
    return { codes, finalPath: `${u.pathname}${u.search}`, status: res.status };
  }
  return { codes, finalPath: null, status: 0 };
}
for (const r of loadRedirects()) {
  const { codes, finalPath, status } = await follow(r.from);
  if (r.from === r.to) {
    if (status === 200 && codes.length === 1) ok++;
    else errors.push(`${r.from}: ожидали 200 без редиректа, получили ${codes.join(' → ')}`);
    continue;
  }
  if (codes[0] !== 301 && codes[0] !== 308) errors.push(`${r.from}: ожидали 301, получили ${codes.join(' → ')}`);
  else if (finalPath !== r.to) errors.push(`${r.from}: ведёт на ${finalPath}, ожидали ${r.to}`);
  else if (status !== 200) errors.push(`${r.from} → ${r.to}: цель отвечает ${status}`);
  else {
    ok++;
    if (codes.length > 2) warnings.push(`${r.from}: ${codes.length - 1} шага редиректа (${codes.join(' → ')})`);
  }
}
console.log(`Редиректы: ${ok} из ${loadRedirects().length} в порядке${errors.length ? `, ошибок ${errors.length}` : ''}`);
for (const e of errors) console.log(`  ${e}`);
for (const w of warnings) console.log(`  [цепочка] ${w}`);
process.exit(errors.length ? 1 : 0);
