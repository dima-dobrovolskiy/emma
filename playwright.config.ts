import { defineConfig, devices } from '@playwright/test';

// e2e по статической сборке: перед запуском `pnpm build`. Локально без скачивания браузеров: PW_CHANNEL=chrome.
const channel = process.env.PW_CHANNEL;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4175', trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm exec tsx scripts/gen-redirects.ts && pnpm exec serve out -l 4175 -c ../serve.json --no-clipboard',
    url: 'http://localhost:4175',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], ...(channel ? { channel } : {}) } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], ...(channel ? { channel } : {}) } },
  ],
});
