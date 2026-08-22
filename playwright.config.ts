import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const skipWebServer = Boolean(process.env.PLAYWRIGHT_SKIP_WEBSERVER);

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
    { name: 'admin', testMatch: /admin\/.*\.spec\.ts/, use: { viewport: { width: 1280, height: 800 } } },
    { name: 'auth', testMatch: /auth\/.*\.spec\.ts/ },
    { name: 'chat', testMatch: /chat\/.*\.spec\.ts/ },
  ],
  webServer: skipWebServer
    ? undefined
    : [
        {
          command: 'npm run dev --workspace=backend',
          url: 'http://localhost:3000/health',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            NODE_ENV: 'development',
            DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/pharma_exchange?schema=public',
            JWT_SECRET: process.env.JWT_SECRET ?? 'dev-jwt-secret-min-32-characters-long',
            RATE_LIMIT_MAX: '10000',
            SMTP_HOST: 'smtp.gmail.com',
            SMTP_PORT: '587',
            SMTP_SECURE: 'false',
            SMTP_USER: 'dev-test@gmail.com',
            SMTP_PASS: 'dev-test-app-password',
            MAIL_FROM: 'Pharma Exchange <dev-test@gmail.com>',
            RAZORPAY_ENABLED: 'false',
          },
        },
        {
          command: 'npm run dev --workspace=frontend',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
});
