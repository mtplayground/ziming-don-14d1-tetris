import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:8080',
    viewport: { width: 1280, height: 900 },
  },
});
