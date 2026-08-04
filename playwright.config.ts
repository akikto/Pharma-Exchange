import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...devices['Pixel 5'],
  },
  projects: [
    { name: 'buyer', testMatch: /buyer\/.*\.spec\.ts/ },
    { name: 'seller', testMatch: /(seller|orders)\/.*\.spec\.ts/ },
    { name: 'admin', testMatch: /admin\/.*\.spec\.ts/ },
    { name: 'auth', testMatch: /auth\/login\.spec\.ts/ },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'npm run dev --workspace=frontend',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
