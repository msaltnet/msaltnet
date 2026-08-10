import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'site.spec.mjs',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'python3 -m http.server 4173 --directory _site',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
});
