import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

/**
 * Playwright configuration for E2E tests
 *
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Test files pattern
  testMatch: '**/*.spec.ts',

  // Run tests in files in parallel
  fullyParallel: !process.env.CI,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI (avoid database conflicts)
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['github'], // GitHub Actions annotations
    ['list'], // Console output
  ],

  // Global setup runs once before all tests
  globalSetup: require.resolve('./global-setup.ts'),

  // Shared settings for all projects
  use: {
    // Base URL for page.goto()
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',

    // Disable trace (reduces output size)
    trace: 'off',

    // Screenshot on failure (kept for debugging)
    screenshot: 'only-on-failure',

    // Disable video (reduces output size significantly)
    video: 'off',

    // Maximum time for actions like click, fill, etc.
    actionTimeout: 10 * 1000,

    // Maximum time for navigation
    navigationTimeout: 30 * 1000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },

    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Test against mobile viewports
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // Run your local dev server before starting the tests
  // Uncomment if you want Playwright to start the servers automatically
  // webServer: [
  //   {
  //     command: 'npm run dev',
  //     url: 'http://localhost:3000',
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120 * 1000,
  //   },
  // ],
});
