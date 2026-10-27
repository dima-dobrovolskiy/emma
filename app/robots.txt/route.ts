import { absUrl, SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

// Фильтры, сортировки и пагинация отзывов закрыты от индексации. ?color= на карточке не закрываем: там canonical на модель.
export function GET() {
  const host = new URL(SITE_URL).host;
  const body = `User-agent: *
Allow: /
Disallow: /data/
Disallow: /*?*age=
Disallow: /*?*weight=
Disallow: /*?*carry=
Disallow: /c/*?*color=
Disallow: /*?*season=
Disallow: /*?*sort=
Disallow: /*?*page=
Disallow: /*?*stars=

User-agent: Yandex
Allow: /
Disallow: /data/
Disallow: /*?*age=
Disallow: /*?*weight=
Disallow: /*?*carry=
Disallow: /c/*?*color=
Disallow: /*?*season=
Disallow: /*?*sort=
Clean-param: page&stars&sort&age&weight&carry&season /
Clean-param: color /p/

Host: ${host}
Sitemap: ${absUrl('/sitemap.xml')}
# llms: ${absUrl('/llms.txt')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
