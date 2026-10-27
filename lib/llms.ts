import { getCatalog, getTrustNumbers } from './catalog';
import { getGuides } from './guides';
import { formatNumber, formatPrice, t } from './i18n';
import { BUYER_PAGES } from './nav';
import { absUrl, KASPI_SHOP_URL } from './site';
import { creditText, fmtRating, maxWeightKg, modelSummary } from './summary';

/* llms.txt и llms-full.txt: короткая и полная выжимка сайта для AI-поиска. Собирается из тех же данных. */

export function llmsTxt(full: boolean): string {
  const { categories, models, pricesDate } = getCatalog();
  const tr = getTrustNumbers();
  const lines: string[] = [];
  lines.push(`# ${t('meta.siteName')}`, '');
  lines.push(
    `> ${t('llms.lead', {
      lead: t('home.lead'),
      years: tr.years !== null ? t('common.yearsCount', { count: tr.years }) : '-',
      orders: tr.ordersSegment !== null ? t('trust.orders', { value: formatNumber(tr.ordersSegment) }) : '-',
      reviews: t('common.reviewsCount', { count: tr.reviews }),
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
  for (const g of getGuides()) {
    lines.push(`- [${g.h1}](${absUrl(`/k/${g.slug}`)}): ${g.short ?? g.description}`);
    if (full && g.faq.length) {
      lines.push('');
      for (const f of g.faq) lines.push(`  - ${f.q} ${f.a}`);
      lines.push('');
    }
  }
  // Возраст и максимальный вес - главное, о чём спрашивают про переноски; их и выносим в строку модели.
  lines.push('', `## ${t('llms.models')}`, '');
  for (const m of models) {
    if (full) {
      lines.push(`### [${m.name}](${absUrl(`/p/${m.slug}`)})`, '', modelSummary(m), '');
      lines.push(`${t('model.allColors')}: ${m.variants.map((v) => `${v.designName} - ${formatPrice(v.price)}${v.inStock ? '' : ` (${t('common.outOfStock')})`}`).join('; ')}.`, '');
    } else {
      const credit = creditText(m);
      const maxW = maxWeightKg(m);
      const age = m.ageRange?.from === 0 ? t('podbor.fromBirth') : m.ageRange?.from ? t('podbor.fromMonths', { count: m.ageRange.from }) : null;
      const price = m.minPrice === m.maxPrice ? formatPrice(m.minPrice) : `${t('common.from')} ${formatPrice(m.minPrice)}`;
      const parts = [
        age,
        maxW !== null ? t('category.weightUpTo', { value: maxW }) : null,
        price,
        credit,
        m.ratingAvg !== null ? `${fmtRating(m.ratingAvg)} (${t('common.reviewsCount', { count: m.reviewsCount })})` : null,
      ].filter(Boolean);
      lines.push(`- [${m.name}](${absUrl(`/p/${m.slug}`)}): ${parts.join(', ')}`);
    }
  }
  lines.push('', `## ${t('llms.buyers')}`, '');
  lines.push(`- [${t('nav.podbor')}](${absUrl('/podbor')})`, `- [${t('nav.reviews')}](${absUrl('/otzyvy')})`);
  for (const p of BUYER_PAGES) lines.push(`- [${t(p.key)}](${absUrl(p.href)})`);
  if (!full) lines.push('', `- ${absUrl('/llms-full.txt')}`);
  lines.push('', t('footer.fraudText'), '');
  return lines.join('\n');
}
