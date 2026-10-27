/*
 * Сверка сайта с живым Kaspi на N случайных расцветках (по умолчанию 5):
 * цена, платёж в месяц и срок, наличие, число отзывов с текстом.
 *   tsx scripts/check-kaspi-parity.ts [--n=5]
 * Сайт = то, что соберётся из data/kaspi + content (lib/catalog). Kaspi = листинг магазина и API отзывов прямо сейчас.
 */
import { getCatalog } from '../lib/catalog';
import { parseListingItem, rawListingSchema, rawReviewsSchema, groupTotal } from '../lib/kaspi/parse';

const args = new Map(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=') as [string, string]));
const N = Number(args.get('n') ?? 5);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const headers = { 'User-Agent': UA, Accept: 'application/json, text/*', 'X-KS-City': '750000000', Referer: 'https://kaspi.kz/shop/m/8851015/products' };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const live = new Map<string, ReturnType<typeof parseListingItem>>();
for (let page = 0; page < 6; page++) {
  const res = await fetch(`https://kaspi.kz/yml/product-view/pl/results?page=${page}&q=%3AallMerchants%3A8851015&text&sort=price-asc&qs&c=750000000&ui=d&i=-1`, { headers });
  const data = rawListingSchema.parse(await res.json()).data;
  if (!data.length) break;
  for (const raw of data) {
    const i = parseListingItem(raw);
    live.set(i.kaspiCode, i);
  }
  await sleep(1200);
}

const variants = getCatalog().models.flatMap((m) => m.variants.map((v) => ({ m, v })));
const picked = [...variants].sort(() => Math.random() - 0.5).slice(0, N);
let bad = 0;
for (const { m, v } of picked) {
  const k = live.get(v.kaspiCode);
  await sleep(1200);
  const rev = rawReviewsSchema.parse(
    await (
      await fetch(`https://kaspi.kz/yml/review-view/api/v1/reviews/product/${v.kaspiCode}?baseProductCode&orderCode&filter=COMMENT&sort=POPULARITY&limit=1&merchantCodes&withAgg=true`, {
        headers: { ...headers, Referer: v.kaspiUrl },
      })
    ).json(),
  );
  const siteCredit = v.creditMonthlyPrice?.replace(/ /g, ' ') ?? null;
  const rows: Array<[string, unknown, unknown]> = [
    ['цена', v.price, k?.price],
    ['платёж/мес', siteCredit, k?.creditMonthlyPrice],
    ['срок', v.creditMonths, k?.creditMonths],
    ['наличие', v.inStock, k?.inStock ?? false],
    ['отзывов с текстом', v.reviewsCount, groupTotal(rev, 'COMMENT')],
  ];
  const diff = rows.filter(([, a, b]) => a !== b);
  if (diff.length) bad++;
  console.log(`${diff.length ? 'РАСХОЖДЕНИЕ' : 'OK'}  ${m.name}, ${v.designName} (${v.kaspiCode})`);
  for (const [name, a, b] of rows) console.log(`    ${name}: сайт ${String(a)} · Kaspi ${String(b)}${a !== b ? '  ←' : ''}`);
}
console.log(bad ? `\nРасхождений: ${bad} из ${N}. Обычно это значит, что данные изменились после последней синхронизации: pnpm sync.` : `\nВсе ${N} расцветок совпадают с Kaspi.`);
process.exit(bad ? 1 : 0);
