import { getCatalog, getTrustNumbers } from './catalog';
import { getGuides } from './guides';
import { formatNumber, formatPrice, t } from './i18n';
import { BUYER_PAGES } from './nav';
import { absUrl, contactLinks, KASPI_SHOP_URL, siteContent } from './site';
import { specSections } from './specs';
import { creditText, fmtRating, maxWeightKg, modelFaq, modelSummary, renderTemplate } from './summary';

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

  // Факты о магазине одним списком: кто продаёт, где, как купить и как связаться.
  const { contacts, legal } = siteContent;
  const contactLine = contactLinks()
    .filter((c) => c.kind !== 'phone')
    .map((c) => `${c.kind === 'email' ? t('contacts.email').toLowerCase() : t(`contacts.${c.kind}`)} ${c.label}`)
    .join(', ');
  lines.push(`## ${t('llms.about')}`, '');
  lines.push(
    ...[
      tr.marketYears !== null && t('llms.marketYears', { years: t('common.yearsCount', { count: tr.marketYears }) }),
      tr.merchantRating !== null && t('llms.shopRating', { rating: fmtRating(tr.merchantRating) }),
      contacts.city && t('llms.city', { city: contacts.city }),
      t('llms.buy'),
      contactLine && `${t('footer.contacts')}: ${contactLine}${contacts.hours ? `; ${t('contacts.hours').toLowerCase()} ${contacts.hours}` : ''}`,
      legal.entity && t('footer.legalLine', { entity: legal.entity, bin: legal.bin ?? '' }),
    ]
      .filter((x): x is string => Boolean(x))
      .map((x) => `- ${x}`),
    '',
  );
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
      const specs = specSections(m).flatMap((g) => g.rows);
      if (specs.length) lines.push(`${t('model.specs')}:`, ...specs.map((r) => `- ${r.name}: ${r.value}`), '');
      if (m.care.length) lines.push(`${t('model.care')}: ${m.care.map((x) => renderTemplate(x, m)).join(' ')}`, '');
      const faq = modelFaq(m);
      if (faq.length) lines.push(`${t('llms.faq')}:`, ...faq.map((f) => `- ${f.q} ${f.a}`), '');
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
        m.variants.length > 1 ? t('common.colorsCount', { count: m.variants.length }) : null,
        m.ratingAvg !== null ? `${fmtRating(m.ratingAvg)} (${t('common.reviewsCount', { count: m.reviewsCount })})` : null,
      ].filter(Boolean);
      lines.push(`- [${m.name}](${absUrl(`/p/${m.slug}`)}): ${parts.join(', ')}`);
    }
  }
  lines.push('', `## ${t('llms.buyers')}`, '');
  lines.push(`- [${t('nav.podbor')}](${absUrl('/podbor')})`, `- [${t('nav.reviews')}](${absUrl('/otzyvy')})`);
  for (const p of BUYER_PAGES) lines.push(`- [${t(p.key)}](${absUrl(p.href)})`);
  if (!full) lines.push('', `- ${absUrl('/llms-full.txt')}`);
  lines.push('', t('llms.paymentNote'), '');
  return lines.join('\n');
}
