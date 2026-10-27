import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: false,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  // CSS встраивается в HTML: на мобильном это убирает блокирующий запрос стилей перед первым экраном.
  experimental: { inlineCss: true },
};

export default nextConfig;
