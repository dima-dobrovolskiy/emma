import type { Metadata, Viewport } from 'next';
import { Golos_Text } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Analytics } from '@/components/analytics/Analytics';
import { JsonLd } from '@/components/ui/JsonLd';
import { t } from '@/lib/i18n';
import { KASPI_SHOP_URL, SITE_URL, absUrl } from '@/lib/site';
import { KASPI_CDN } from '@/lib/images';

// Golos Text проверен на казахские буквы ә ғ қ ң ө ұ ү һ і (docs/DECISIONS.md). Один шрифт на всё - ради скорости первого экрана.
// subsets = что предзагружать; латиница подгрузится по unicode-range, когда понадобится.
const body = Golos_Text({ subsets: ['cyrillic'], variable: '--font-body', display: 'swap' });

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
  themeColor: '#fbf8f4',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={body.variable}>
      <head>
        <link rel="preconnect" href={KASPI_CDN} />
        <link rel="dns-prefetch" href={KASPI_CDN} />
      </head>
      <body className="min-h-dvh">
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <JsonLd
          data={[
            {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              '@id': absUrl('/#org'),
              name: t('meta.siteName'),
              url: SITE_URL,
              sameAs: [KASPI_SHOP_URL],
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
        <Analytics />
      </body>
    </html>
  );
}
