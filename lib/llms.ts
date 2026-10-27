import { getCatalog, getTrustNumbers } from './catalog';
import { getGuides } from './guides';
import { formatNumber, formatPrice, t } from './i18n';
import { absUrl, KASPI_SHOP_URL } from './site';
import { creditText, fmtRating, modelSummary } from './summary';

/* llms.txt и llms-full.txt: короткая и полная выжимка сайта для AI-поиска. Собирается из тех же данных. */

export function llmsTxt(full: boolean): string {
  const { categories, models, pricesDate } = getCatalog();
  const tr = getTrustNumbers();
  const lines: string[] = [];
  lines.push(`# ${t('meta.siteName')}`, '');
  lines.push(
    `> ${t('llms.lead', {
      lead: t('home.lead'),
      source: t('trust.sourceNote'),
      years: tr.years !== null ? t('common.yearsCount', { count: tr.years }) : '-',
      orders: tr.ordersSegment !== null ? t('trust.orders', { value: formatNumber(tr.ordersSegment) }) : '-',
      reviews: formatNumber(tr.reviews),
      rating: tr.rating !== null ? fmtRating(tr.rating) : '-',
    })}`,
    '',
  );
  lines.push(`- ${t('footer.kaspiShop')}: ${KASPI_SHOP_URL}`, `- ${t('common.pricesActual', { date: pricesDate })}`, '');
  lines.push(`## ${t('footer.catalog')}`, '');
  for (const c of categories.filter((x) => x.models.length)) {
    lines.push(`- [${c.name}](${absUrl(`/c/${c.slug}`)}): ${c.intro}`);
  }
  lines.push('', `## ${t('nav.guides')}`, '');
  for (const g of getGuides()) lines.push(`- [${g.h1}](${absUrl(`/k/${g.slug}`)}): ${g.description}`);
  lines.push('', `## ${t('nav.catalog')}`, '');
  for (const m of models) {
    if (full) {
      lines.push(`### [${m.name}](${absUrl(`/p/${m.slug}`)})`, '', modelSummary(m), '');
      lines.push(`${t('model.allColors')}: ${m.variants.map((v) => `${v.designName} - ${formatPrice(v.price)}${v.inStock ? '' : ` (${t('common.outOfStock')})`}`).join('; ')}.`, '');
    } else {
      const credit = creditText(m);
      lines.push(`- [${m.name}](${absUrl(`/p/${m.slug}`)}): ${t('common.from')} ${formatPrice(m.minPrice)}${credit ? `, ${credit}` : ''}${m.ratingAvg !== null ? `, ${fmtRating(m.ratingAvg)} (${t('common.reviewsCount', { count: m.reviewsCount })})` : ''}`);
    }
  }
  if (!full) lines.push('', `- ${absUrl('/llms-full.txt')}`);
  lines.push('', t('footer.fraudText'), '');
  return lines.join('\n');
}
