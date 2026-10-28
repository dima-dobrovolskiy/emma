import type { Metadata, Viewport } from 'next';
import { Golos_Text, Spectral } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Analytics } from '@/components/analytics/Analytics';
import { JsonLd } from '@/components/ui/JsonLd';
import { Motion, PageTransition } from '@/components/ui/Motion';
import { t } from '@/lib/i18n';
import { KASPI_SHOP_URL, SITE_URL, absUrl, contactLinks, siteContent } from '@/lib/site';
import { KASPI_CDN } from '@/lib/images';

// Оба шрифта проверены на казахские буквы ә ғ қ ң ө ұ ү һ і (docs/DECISIONS.md).
// Golos Text - текст, цены и интерфейс; Spectral 500 - заголовки и крупные цифры. Два файла начертаний на загрузке.
// subsets = что предзагружать; остальные наборы знаков подгрузятся по unicode-range, когда понадобятся.
const body = Golos_Text({ subsets: ['cyrillic'], variable: '--font-body', display: 'swap' });
// Spectral без предзагрузки: с ней LCP главной в Lighthouse mobile рос до 3,8 с (шрифты делили канал с главным фото).
// Заголовки на первом показе мелькают запасной антиквой Georgia; размеры подогнаны next/font, сдвига вёрстки нет.
const display = Spectral({ subsets: ['cyrillic', 'latin'], weight: '500', variable: '--font-display-face', display: 'swap', preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: t('meta.homeTitle'), template: `%s${t('meta.titleSuffix')}` },
  applicationName: t('meta.siteName'),
  openGraph: { siteName: t('meta.siteName'), locale: t('meta.locale'), type: 'website' },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${body.variable} ${display.variable}`} data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href={KASPI_CDN} />
        <link rel="dns-prefetch" href={KASPI_CDN} />
      </head>
      <body className="min-h-dvh">
        <Header />
        <main id="main">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        <JsonLd
          data={[
            {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              '@id': absUrl('/#org'),
              name: t('meta.siteName'),
              alternateName: siteContent.alternateNames,
              url: SITE_URL,
              ...(siteContent.legal.entity ? { legalName: siteContent.legal.entity } : {}),
              ...(siteContent.legal.bin ? { taxID: siteContent.legal.bin } : {}),
              ...(siteContent.contacts.email ? { email: siteContent.contacts.email } : {}),
              ...(siteContent.contacts.phone
                ? { contactPoint: [{ '@type': 'ContactPoint', telephone: siteContent.contacts.phone.replace(/[^\d+]/g, ''), contactType: 'customer service', availableLanguage: ['ru'] }] }
                : {}),
              ...(siteContent.legal.address ? { address: { '@type': 'PostalAddress', streetAddress: siteContent.legal.address, addressCountry: 'KZ' } } : {}),
              sameAs: [KASPI_SHOP_URL, ...contactLinks().filter((c) => c.kind === 'instagram').map((c) => c.href)],
            },
            {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              '@id': absUrl('/#website'),
              name: t('meta.siteName'),
              url: SITE_URL,
              inLanguage: 'ru-KZ',
              publisher: { '@id': absUrl('/#org') },
            },
          ]}
        />
        <Motion />
        <Analytics />
      </body>
    </html>
  );
}
