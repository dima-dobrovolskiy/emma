import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Фото отдаются с CDN Kaspi их собственными размерами через srcset (статическая сборка, без оптимизатора Next).
      '@next/next/no-img-element': 'off',
    },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', '.cache/**', 'docs/**', 'next-env.d.ts', 'reports/**', 'test-results/**', 'playwright-report/**'],
  },
];

export default config;
